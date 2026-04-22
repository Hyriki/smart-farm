import { getAllTelemetriesController } from '@/db/controllers/telemetryController';
import { requireAuth } from '@/lib/auth';
import { ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const telemetries = await getAllTelemetriesController(
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );

    return ok({ message: 'Telemetries fetched successfully', telemetries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    return serverError(error);
  }
}
