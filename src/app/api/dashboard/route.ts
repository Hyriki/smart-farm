import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";

type BoundingBox = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function parseBoundingBox(value: unknown): BoundingBox {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as BoundingBox;
  }

  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
}

function mapDetectionStatus(role: string) {
  const lowerRole = role.toLowerCase();

  if (
    lowerRole.includes("disease") ||
    lowerRole.includes("pest") ||
    lowerRole.includes("alert") ||
    lowerRole.includes("warning")
  ) {
    return "disease";
  }

  return "healthy";
}

export async function GET(request: Request) {
  try {
    requireAuth(request);

    const [
      sensorCount,
      activeSensorCount,
      actuatorCount,
      devicesOnline,
      telemetryCount,
      alertCount,
      frameCount,
      latestTelemetries,
      recentTelemetries,
      actuators,
      latestFrame,
    ] = await Promise.all([
      prisma.sensor.count(),

      prisma.sensor.count({
        where: {
          status: "online",
        },
      }),

      prisma.actuator.count(),

      prisma.actuator.count({
        where: {
          currentState: {
            not: "OFF",
          },
        },
      }),

      prisma.telemetry.count(),
      prisma.alert.count(),
      prisma.frame.count(),

      // Latest telemetry per sensor
      prisma.sensor.findMany({
        include: {
          telemetries: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
        orderBy: { id: "asc" },
      }),

      // Latest telemetry records for charts
      prisma.telemetry.findMany({
        orderBy: {
          timestamp: "desc",
        },
        take: 12,
      }),

      // All actuator states
      prisma.actuator.findMany({
        select: {
          id: true,
          role: true,
          currentState: true,
          updatedAt: true,
        },
        orderBy: { id: "asc" },
      }),

      // Latest frame with AI detections
      prisma.frame.findFirst({
        orderBy: {
          timestamp: "desc",
        },
        include: {
          detections: true,
        },
      }),
    ]);

    const sensorReadings = latestTelemetries.map((sensor) => ({
      sensorId: sensor.id,
      sensorType: sensor.type,
      location: sensor.location,
      status: sensor.status,
      latest: sensor.telemetries[0] ?? null,
    }));

    const latestTelemetry =
      recentTelemetries.length > 0 ? recentTelemetries[0] : null;

    const orderedTelemetries = [...recentTelemetries].reverse();

    const detections =
      latestFrame?.detections.map((detection) => {
        const bbox = parseBoundingBox(detection.boundingBox);

        return {
          label: detection.role,
          confidence: Math.round((detection.confidenceScore ?? 0) * 100),
          status: mapDetectionStatus(detection.role),
          bbox: {
            x: bbox.x ?? 0,
            y: bbox.y ?? 0,
            width: bbox.width ?? 0,
            height: bbox.height ?? 0,
          },
        };
      }) ?? [];

    return ok({
      message: "Dashboard data fetched successfully",

      current: {
        humidity: latestTelemetry?.humidity ?? null,
        temperature: latestTelemetry?.ambientTemperature ?? null,
        soilMoisture: latestTelemetry?.soilMoisture ?? null,
        lightIntensity: latestTelemetry?.lightIntensity ?? null,
      },

      trends: {
        light: orderedTelemetries.map((item) => ({
          time: formatTime(item.timestamp),
          value: item.lightIntensity ?? 0,
        })),

        temperature: orderedTelemetries.map((item) => ({
          time: formatTime(item.timestamp),
          value: item.ambientTemperature ?? 0,
        })),

        moisture: orderedTelemetries.map((item) => ({
          time: formatTime(item.timestamp),
          value: item.soilMoisture ?? 0,
        })),
      },

      ai: {
        imageUrl: "",
        detections,
      },

      stats: {
        sensors: sensorCount,
        activeSensors: activeSensorCount,
        actuators: actuatorCount,
        devicesOnline,
        telemetries: telemetryCount,
        alerts: alertCount,
        frames: frameCount,

        // Your schema currently does not have Plant model / health score table.
        plantsMonitored: null,
        healthScore: null,
      },

      sensorReadings,
      actuators,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("token")) {
      return unauthorized(message);
    }

    return serverError(error);
  }
}