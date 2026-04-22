import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, serverError, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);

    const [
      sensorCount,
      actuatorCount,
      telemetryCount,
      alertCount,
      frameCount,
      latestTelemetries,
      actuators,
    ] = await Promise.all([
      prisma.sensor.count(),
      prisma.actuator.count(),
      prisma.telemetry.count(),
      prisma.alert.count(),
      prisma.frame.count(),
      // Latest telemetry per sensor (last reading)
      prisma.sensor.findMany({
        include: {
          telemetries: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: { id: 'asc' },
      }),
      // All actuator states
      prisma.actuator.findMany({
        select: {
          id: true,
          role: true,
          currentState: true,
          updatedAt: true,
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    const sensorReadings = latestTelemetries.map((sensor) => ({
      sensorId: sensor.id,
      sensorType: sensor.type,
      location: sensor.location,
      status: sensor.status,
      latest: sensor.telemetries[0] ?? null,
    }));

    return ok({
      message: 'Dashboard data fetched successfully',
      stats: {
        sensors: sensorCount,
        actuators: actuatorCount,
        telemetries: telemetryCount,
        alerts: alertCount,
        frames: frameCount,
      },
      sensorReadings,
      actuators,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('token')) return unauthorized(message);
    return serverError(error);
  }
}
