import { publishMqtt } from '@/lib/mqtt/client';
import { getBuzzerHardwareState, forceBuzzerStateOff } from '@/lib/mqtt/sensorDataHandler';
import { prisma } from '@/lib/prisma';
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

    // Direct Prisma lookup — no 'use server' controller chain.
    const actuator = await prisma.actuator.findUnique({
      where: { id: actuatorId },
      select: { id: true, role: true, currentState: true, mode: true },
    });
    if (!actuator) return notFound('Actuator not found');

    // ----------------------------------------------------------------
    // Buzzer — toggle MODE (OFF ↔ AUTO).
    // Hardware state (buzzerState) is managed by threshold logic; we only
    // control the mode here. Forcing buzzerState OFF when mode goes to OFF.
    // ----------------------------------------------------------------
    if (actuator.role === 'buzzer') {
      const currentMode: 'AUTO' | 'OFF' = actuator.mode === 'AUTO' ? 'AUTO' : 'OFF';
      const nextMode: 'AUTO' | 'OFF' = currentMode === 'AUTO' ? 'OFF' : 'AUTO';

      await prisma.actuator.update({
        where: { id: actuatorId },
        data: { mode: nextMode, toggledById: user.userId },
      });

      let mqttPublished = false;
      let warning: string | undefined;

      if (nextMode === 'OFF') {
        await forceBuzzerStateOff();
        mqttPublished = await publishMqtt('yolofarm/control/buzzer', 'OFF');
        if (!mqttPublished) {
          warning = 'MQTT not connected — DB updated, hardware publish skipped';
        }
      }

      return ok({
        success: true,
        actuatorId,
        buzzerMode: nextMode,
        buzzerState: getBuzzerHardwareState(),
        mqttPublished,
        ...(warning ? { warning } : {}),
      });
    }

    // ----------------------------------------------------------------
    // Generic actuators (heater, etc.) — toggle currentState ON ↔ OFF.
    // ----------------------------------------------------------------
    const targetState: 'ON' | 'OFF' =
      body.nextState === 'ON' || body.nextState === 'OFF'
        ? body.nextState
        : actuator.currentState === 'ON' ? 'OFF' : 'ON';

    const updated = await prisma.actuator.update({
      where: { id: actuatorId },
      data: { currentState: targetState, toggledById: user.userId },
      select: { id: true, role: true, currentState: true, updatedAt: true },
    });

    const mqttPublished = await publishMqtt(
      `yolofarm/control/${updated.role}`,
      updated.currentState,
    );

    return ok({
      success: true,
      actuator: updated,
      mqttPublished,
      ...(mqttPublished ? {} : { warning: 'MQTT not connected — DB updated, hardware publish skipped' }),
    });

  } catch (error) {
    console.error('[TOGGLE_ROUTE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    return serverError(error);
  }
}
