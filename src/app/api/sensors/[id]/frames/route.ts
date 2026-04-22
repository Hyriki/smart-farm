import {
  createFrameController,
  getFramesBySensorIdController,
} from '@/db/controllers/frameController';
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    const frames = await getFramesBySensorIdController(
      sensorId,
      limit ? Number(limit) : undefined,
    );
    return ok({ message: 'Sensor frames fetched successfully', frames });
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
    const frame = await createFrameController({
      sensorId,
      attribute: body.attribute,
      timestamp: body.timestamp,
    });

    return ok({ message: 'Frame created for sensor successfully', frame }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Sensor not found') return notFound(message);
    return serverError(error);
  }
}
