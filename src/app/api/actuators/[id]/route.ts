import {
  deleteActuatorController,
  getActuatorByIdController,
  updateActuatorController,
} from '@/db/controllers/actuatorController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const actuatorId = await parseId(context.params);
    if (Number.isNaN(actuatorId)) return badRequest('Invalid actuator id');

    const actuator = await getActuatorByIdController(actuatorId);
    return ok({ message: 'Actuator fetched successfully', actuator });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Actuator not found') return notFound(message);
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const actuatorId = await parseId(context.params);
    if (Number.isNaN(actuatorId)) return badRequest('Invalid actuator id');

    const body = await request.json();
    const actuator = await updateActuatorController(actuatorId, {
      role: body.role,
      currentState: body.currentState,
    });

    return ok({ message: 'Actuator updated successfully', actuator });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Actuator not found') return notFound(message);
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin']);

    const actuatorId = await parseId(context.params);
    if (Number.isNaN(actuatorId)) return badRequest('Invalid actuator id');

    await deleteActuatorController(actuatorId);
    return ok({ message: 'Actuator deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Actuator not found') return notFound(message);
    return serverError(error);
  }
}
