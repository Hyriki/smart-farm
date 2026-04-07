import { createSensorController, getSensorsController } from '@/db/controllers/sensorController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const sensors = await getSensorsController();
    return ok({ message: 'Sensors fetched successfully', sensors });
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
    if (!body.type) return badRequest('Sensor type is required');

    const sensor = await createSensorController({
      type: body.type,
      location: body.location,
      status: body.status,
    });

    return ok({ message: 'Sensor created successfully', sensor }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    return serverError(error);
  }
}
