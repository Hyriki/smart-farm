import {
  deleteTelemetryController,
  getTelemetryByIdController,
} from '@/db/controllers/telemetryController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const id = await parseId(context.params);
    if (Number.isNaN(id)) return badRequest('Invalid telemetry id');

    const telemetry = await getTelemetryByIdController(id);
    return ok({ message: 'Telemetry fetched successfully', telemetry });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Telemetry not found') return notFound(message);
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin']);

    const id = await parseId(context.params);
    if (Number.isNaN(id)) return badRequest('Invalid telemetry id');

    await deleteTelemetryController(id);
    return ok({ message: 'Telemetry deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Telemetry not found') return notFound(message);
    return serverError(error);
  }
}
