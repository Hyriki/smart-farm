import { createActuatorController, getActuatorsController } from '@/db/controllers/actuatorController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const actuators = await getActuatorsController();
    return ok({ message: 'Actuators fetched successfully', actuators });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const body = await request.json();
    if (!body.role) return badRequest('Actuator role is required');

    const actuator = await createActuatorController({
      role: body.role,
      currentState: body.currentState,
    });

    return ok({ message: 'Actuator created successfully', actuator }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    return serverError(error);
  }
}
