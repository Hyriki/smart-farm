import {
  createAlertTriggerController,
  deleteAlertTriggerController,
  getAlertTriggersController,
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

    const triggers = await getAlertTriggersController(alertId);
    return ok({ message: 'Alert triggers fetched successfully', triggers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Alert not found') return notFound(message);
    return serverError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const alertId = await parseId(context.params);
    if (Number.isNaN(alertId)) return badRequest('Invalid alert id');

    const body = await request.json();
    if (!body.detectionId) return badRequest('detectionId is required');

    const trigger = await createAlertTriggerController(alertId, Number(body.detectionId));
    return ok({ message: 'Alert trigger created successfully', trigger }, 201);
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

    const { searchParams } = new URL(request.url);
    const detectionId = searchParams.get('detectionId');
    if (!detectionId) return badRequest('detectionId query param is required');

    await deleteAlertTriggerController(alertId, Number(detectionId));
    return ok({ message: 'Alert trigger deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Alert not found') return notFound(message);
    return serverError(error);
  }
}
