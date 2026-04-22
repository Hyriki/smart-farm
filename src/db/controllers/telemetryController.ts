import {
  deleteTelemetry,
  getAllTelemetries,
  getLatestTelemetryPerSensor,
  getTelemetryById,
  getTelemetryHistory,
} from '@/db/models/telemetryModel';

export async function getAllTelemetriesController(limit?: number, offset?: number) {
  return getAllTelemetries(limit, offset);
}

export async function getTelemetryByIdController(id: number) {
  const telemetry = await getTelemetryById(id);
  if (!telemetry) throw new Error('Telemetry not found');
  return telemetry;
}

export async function getLatestTelemetryPerSensorController() {
  return getLatestTelemetryPerSensor();
}

export async function getTelemetryHistoryController(options: {
  sensorId?: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  return getTelemetryHistory({
    sensorId: options.sensorId,
    from: options.from ? new Date(options.from) : undefined,
    to: options.to ? new Date(options.to) : undefined,
    limit: options.limit,
    offset: options.offset,
  });
}

export async function deleteTelemetryController(id: number) {
  const telemetry = await getTelemetryById(id);
  if (!telemetry) throw new Error('Telemetry not found');
  return deleteTelemetry(id);
}
