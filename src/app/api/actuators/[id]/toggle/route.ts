import { toggleActuatorController } from '@/db/controllers/actuatorController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const actuatorId = await parseId(context.params);
    if (Number.isNaN(actuatorId)) return badRequest('Invalid actuator id');

    const body = await request.json().catch(() => ({}));
    const actuator = await toggleActuatorController(actuatorId, user.userId, body.currentState);

    return ok({ message: 'Actuator toggled successfully', actuator });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Actuator not found') return notFound(message);
    return serverError(error);
  }
}
