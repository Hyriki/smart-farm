import { getLatestTelemetryPerSensorController } from '@/db/controllers/telemetryController';
import { requireAuth } from '@/lib/auth';
import { ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const readings = await getLatestTelemetryPerSensorController();
    return ok({ message: 'Latest readings fetched successfully', readings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    return serverError(error);
  }
}
