import { createAlertController, getAlertsController } from '@/db/controllers/alertController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const alerts = await getAlertsController();
    return ok({ message: 'Alerts fetched successfully', alerts });
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
    if (!body.type) return badRequest('Alert type is required');
    if (!body.severity) return badRequest('Alert severity is required');

    const alert = await createAlertController({
      type: body.type,
      severity: body.severity,
    });

    return ok({ message: 'Alert created successfully', alert }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    return serverError(error);
  }
}
