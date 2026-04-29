import {
  createTelemetryController,
  getSensorTelemetriesController,
} from '@/db/controllers/sensorController';
import { requireAuth, requireRole } from '@/lib/auth';
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/api';

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const sensorId = await parseId(context.params);
    if (Number.isNaN(sensorId)) return badRequest('Invalid sensor id');

    const telemetries = await getSensorTelemetriesController(sensorId);
    return ok({ message: 'Telemetries fetched successfully', telemetries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Sensor not found') return notFound(message);
    return serverError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    requireRole(user.role, ['admin', 'operator']);

    const sensorId = await parseId(context.params);
    if (Number.isNaN(sensorId)) return badRequest('Invalid sensor id');

    const body = await request.json();
    const telemetry = await createTelemetryController(sensorId, {
      soilMoisture: body.soilMoisture,
      humidity: body.humidity,
      lightIntensity: body.lightIntensity,
      ambientTemperature: body.ambientTemperature,
      properties: body.properties,
      timestamp: body.timestamp,
    });

    return ok({ message: 'Telemetry inserted successfully', telemetry }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    if (message === 'Insufficient permissions') return forbidden(message);
    if (message === 'Sensor not found') return notFound(message);
    return serverError(error);
  }
}
