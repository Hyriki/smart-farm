import {
  deleteSensorController,
  getSensorByIdController,
  updateSensorController,
} from '@/db/controllers/sensorController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const sensorId = await parseId(context.params);
    if (Number.isNaN(sensorId)) return badRequest('Invalid sensor id');

    const sensor = await getSensorByIdController(sensorId, user.userId);
    return ok({ message: 'Sensor fetched successfully', sensor });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Sensor not found') return notFound(message);
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const sensorId = await parseId(context.params);
    if (Number.isNaN(sensorId)) return badRequest('Invalid sensor id');

    const body = await request.json();
    const sensor = await updateSensorController(sensorId, {
      type: body.type,
      location: body.location,
      status: body.status,
    });

    return ok({ message: 'Sensor updated successfully', sensor });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Sensor not found') return notFound(message);
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin']);

    const sensorId = await parseId(context.params);
    if (Number.isNaN(sensorId)) return badRequest('Invalid sensor id');

    await deleteSensorController(sensorId);
    return ok({ message: 'Sensor deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Sensor not found') return notFound(message);
    return serverError(error);
  }
}
