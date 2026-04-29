import {
  deleteUserDetectionViewController,
  getUserDetectionViewsController,
  markDetectionViewedController,
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

    if (user.userId !== userId && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const views = await getUserDetectionViewsController(userId);
    return ok({ message: 'Detection views fetched successfully', views });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    return serverError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const userId = await parseId(context.params);
    if (Number.isNaN(userId)) return badRequest('Invalid user id');

    if (user.userId !== userId && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.detectionId) return badRequest('detectionId is required');

    const view = await markDetectionViewedController(userId, Number(body.detectionId));
    return ok({ message: 'Detection marked as viewed', view }, 201);
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
    const detectionId = searchParams.get('detectionId');
    if (!detectionId) return badRequest('detectionId query param is required');

    await deleteUserDetectionViewController(userId, Number(detectionId));
    return ok({ message: 'Detection view deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Record to delete does not exist.') return notFound('View not found');
    return serverError(error);
  }
}
