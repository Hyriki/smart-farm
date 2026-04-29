import {
  deleteFrameController,
  getFrameByIdController,
  updateFrameController,
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
    const frameId = await parseId(context.params);
    if (Number.isNaN(frameId)) return badRequest('Invalid frame id');

    const frame = await getFrameByIdController(frameId);
    return ok({ message: 'Frame fetched successfully', frame });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Frame not found') return notFound(message);
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const frameId = await parseId(context.params);
    if (Number.isNaN(frameId)) return badRequest('Invalid frame id');

    const body = await request.json();
    const frame = await updateFrameController(frameId, {
      attribute: body.attribute,
    });

    return ok({ message: 'Frame updated successfully', frame });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Frame not found') return notFound(message);
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin']);

    const frameId = await parseId(context.params);
    if (Number.isNaN(frameId)) return badRequest('Invalid frame id');

    await deleteFrameController(frameId);
    return ok({ message: 'Frame deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Frame not found') return notFound(message);
    return serverError(error);
  }
}
