import { getTelemetryHistoryController } from '@/db/controllers/telemetryController';
import { requireAuth } from '@/lib/auth';
import { ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);
    const sensorId = searchParams.get('sensorId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await getTelemetryHistoryController({
      sensorId: sensorId ? Number(sensorId) : undefined,
      from: from ?? undefined,
      to: to ?? undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return ok({ message: 'Telemetry history fetched successfully', ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    return serverError(error);
  }
}
