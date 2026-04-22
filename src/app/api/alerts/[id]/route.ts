import {
  deleteAlertController,
  getAlertByIdController,
  updateAlertController,
} from '@/db/controllers/alertController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const alertId = await parseId(context.params);
    if (Number.isNaN(alertId)) return badRequest('Invalid alert id');

    const alert = await getAlertByIdController(alertId);
    return ok({ message: 'Alert fetched successfully', alert });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Alert not found') return notFound(message);
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const alertId = await parseId(context.params);
    if (Number.isNaN(alertId)) return badRequest('Invalid alert id');

    const body = await request.json();
    const alert = await updateAlertController(alertId, {
      type: body.type,
      severity: body.severity,
    });

    return ok({ message: 'Alert updated successfully', alert });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Alert not found') return notFound(message);
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin']);

    const alertId = await parseId(context.params);
    if (Number.isNaN(alertId)) return badRequest('Invalid alert id');

    await deleteAlertController(alertId);
    return ok({ message: 'Alert deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Alert not found') return notFound(message);
    return serverError(error);
  }
}
