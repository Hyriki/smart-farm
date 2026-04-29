import {
  deleteUserSensorViewController,
  getUserSensorViewsController,
} from '@/db/controllers/viewController';
import { requireAuth } from '@/lib/auth';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const userId = await parseId(context.params);
    if (Number.isNaN(userId)) return badRequest('Invalid user id');

    // Users can only view their own views, admins can view any
    if (user.userId !== userId && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const views = await getUserSensorViewsController(userId);
    return ok({ message: 'Sensor views fetched successfully', views });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const userId = await parseId(context.params);
    if (Number.isNaN(userId)) return badRequest('Invalid user id');

    if (user.userId !== userId && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sensorId = searchParams.get('sensorId');
    if (!sensorId) return badRequest('sensorId query param is required');

    await deleteUserSensorViewController(userId, Number(sensorId));
    return ok({ message: 'Sensor view deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Record to delete does not exist.') return notFound('View not found');
    return serverError(error);
  }
}
