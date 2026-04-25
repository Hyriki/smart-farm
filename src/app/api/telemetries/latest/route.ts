import { getLatestTelemetryPerSensorController } from '@/db/controllers/telemetryController';
import { ok, serverError } from '@/lib/api';

export async function GET() {
  try {
    const telemetries = await getLatestTelemetryPerSensorController();
    // For the dashboard, we take the absolute latest one across all sensors
    // or just the first one if only one sensor exists.
    const latest = telemetries.length > 0 ? telemetries[0] : null;
    
    return ok({ 
      message: 'Latest telemetry fetched successfully', 
      telemetry: latest 
    });
  } catch (error) {
    return serverError(error);
  }
}
