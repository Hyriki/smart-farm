import { toggleActuatorController, getActuatorByIdController } from '@/db/controllers/actuatorController';
import { publishMqtt } from '@/lib/mqtt/client';
import { getBuzzerHardwareState, forceBuzzerStateOff } from '@/lib/mqtt/sensorDataHandler';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'viewer']);

    const actuatorId = await parseId(context.params);
    if (Number.isNaN(actuatorId)) return badRequest('Invalid actuator id');

    const body = await request.json().catch(() => ({}));

    const currentActuator = await getActuatorByIdController(actuatorId);

    // ----------------------------------------------------------------
    // Buzzer: toggle MODE (AUTO ↔ OFF), not hardware state
    // ----------------------------------------------------------------
    if (currentActuator.role === 'buzzer') {
      // Read current mode from DB (authoritative source)
      const currentMode: 'AUTO' | 'OFF' =
        currentActuator.currentState === 'AUTO' ? 'AUTO' : 'OFF';
      const nextMode: 'AUTO' | 'OFF' = currentMode === 'AUTO' ? 'OFF' : 'AUTO';

      // Persist new mode in DB
      const updatedActuator = await toggleActuatorController(actuatorId, user.userId, nextMode);

      let mqttPublished = false;
      let warning: string | undefined;

      if (nextMode === 'OFF') {
        forceBuzzerStateOff();
        mqttPublished = await publishMqtt('yolofarm/control/buzzer', 'OFF');
        if (!mqttPublished) {
          warning = 'Buzzer mode saved but MQTT publish skipped (broker not connected)';
        }
      }

      const buzzerState = getBuzzerHardwareState();

      return ok({
        success: true,
        actuatorId,
        buzzerMode: nextMode,
        buzzerState,
        mqttPublished,
        ...(warning ? { warning } : {}),
        actuator: updatedActuator,
      });
    }

    // ----------------------------------------------------------------
    // Generic actuators (heater, relay, etc.)
    // ----------------------------------------------------------------
    let targetState: string | undefined;
    if (body.nextState) {
      targetState = body.nextState;
    } else if (body.currentState) {
      targetState = body.currentState === 'ON' ? 'OFF' : 'ON';
    }

    const actuator = await toggleActuatorController(actuatorId, user.userId, targetState);

    let mqttPublished = false;
    if (actuator) {
      const topic = `yolofarm/control/${actuator.role}`;
      mqttPublished = await publishMqtt(topic, actuator.currentState);
    }

    return ok({ message: 'Actuator toggled successfully', actuator, mqttPublished });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Actuator not found') return notFound(message);
    return serverError(error);
  }
}
