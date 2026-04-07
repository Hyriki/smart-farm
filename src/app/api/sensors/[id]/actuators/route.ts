import {
  connectSensorToActuatorController,
  getSensorActuatorsController,
} from '@/db/controllers/sensorController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const sensorId = await parseId(context.params);
    if (Number.isNaN(sensorId)) return badRequest('Invalid sensor id');

    const actuators = await getSensorActuatorsController(sensorId);
    return ok({ message: 'Sensor actuators fetched successfully', actuators });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Sensor not found') return notFound(message);
    return serverError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const sensorId = await parseId(context.params);
    if (Number.isNaN(sensorId)) return badRequest('Invalid sensor id');

    const body = await request.json();
    if (!body.actuatorId) return badRequest('actuatorId is required');

    const relation = await connectSensorToActuatorController(sensorId, Number(body.actuatorId));
    return ok({ message: 'Sensor linked to actuator successfully', relation }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Sensor not found' || message === 'Actuator not found') return notFound(message);
    return serverError(error);
  }
}
