import { createFrameController, getFramesController } from '@/db/controllers/frameController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const frames = await getFramesController(
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );

    return ok({ message: 'Frames fetched successfully', frames });
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
    if (!body.sensorId) return badRequest('sensorId is required');

    const frame = await createFrameController({
      sensorId: Number(body.sensorId),
      attribute: body.attribute,
      timestamp: body.timestamp,
    });

    return ok({ message: 'Frame created successfully', frame }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Sensor not found') return badRequest(message);
    return serverError(error);
  }
}
