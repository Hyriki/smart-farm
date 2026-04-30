import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";

type BoundingBox = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function parseBoundingBox(value: unknown): BoundingBox {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as BoundingBox;
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

function mapDetectionStatus(role: string) {
  const lower = role.toLowerCase();
  if (
    lower.includes("disease") ||
    lower.includes("pest") ||
    lower.includes("alert") ||
    lower.includes("warning")
  ) {
    return "disease";
  }
  return "healthy";
}

export async function GET(request: Request) {
  try {
    requireAuth(request);

    // ── Core queries — guaranteed to work with the original schema ──────────────
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
      latestFrame,
    ] = await Promise.all([
      prisma.sensor.count(),

      prisma.sensor.count({ where: { status: "online" } }),

      prisma.actuator.count(),

      prisma.actuator.count({ where: { currentState: { not: "OFF" } } }),

      prisma.telemetry.count(),
      prisma.alert.count(),
      prisma.frame.count(),

      prisma.sensor.findMany({
        include: {
          telemetries: { orderBy: { timestamp: "desc" }, take: 1 },
        },
        orderBy: { id: "asc" },
      }),

      prisma.telemetry.findMany({
        orderBy: { timestamp: "desc" },
        take: 12,
      }),

      prisma.frame.findFirst({
        orderBy: { timestamp: "desc" },
        include: { detections: true },
      }),
    ]);

    // ── Resilient queries — need migration to work; fall back gracefully ────────
    // Using `any` cast because the generated Prisma client is stale until
    // `prisma migrate dev` regenerates it with the new mode column + Notification model.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = prisma as any;

    // Actuators with mode field (buzzer only). Uses raw SQL to bypass generated-client
    // validation (which rejects unknown fields even with `any` cast). Falls back to
    // mode: null if the mode column doesn't exist yet (migration not run).
    let actuators: Array<{
      id: number;
      role: string;
      currentState: string;
      mode: string | null;
      updatedAt: Date;
    }>;
    try {
      actuators = await prisma.$queryRaw`
        SELECT "id", "role", "currentState", "mode", "updatedAt"
        FROM   "Actuator"
        ORDER  BY "id" ASC
      `;
    } catch {
      const rows = await prisma.actuator.findMany({
        select: { id: true, role: true, currentState: true, updatedAt: true },
        orderBy: { id: "asc" },
      });
      actuators = rows.map((r) => ({ ...r, mode: null }));
    }

    // Active notifications. Returns [] if the Notification table doesn't exist yet.
    const activeNotifications: unknown[] = pc.notification
      ? await pc.notification
          .findMany({
            where: { isResolved: false },
            orderBy: { updatedAt: "desc" },
          })
          .catch((err: unknown) => {
            console.error("[DASHBOARD] notification query failed:", err);
            return [];
          })
      : [];

    // ── Assemble response ───────────────────────────────────────────────────────
    const sensorReadings = latestTelemetries.map((sensor) => ({
      sensorId: sensor.id,
      sensorType: sensor.type,
      location: sensor.location,
      status: sensor.status,
      latest: sensor.telemetries[0] ?? null,
    }));

    const latestTelemetry = recentTelemetries.length > 0 ? recentTelemetries[0] : null;
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

      ai: { imageUrl: "", detections },

      stats: {
        sensors: sensorCount,
        activeSensors: activeSensorCount,
        actuators: actuatorCount,
        devicesOnline,
        telemetries: telemetryCount,
        alerts: alertCount,
        frames: frameCount,
        plantsMonitored: null,
        healthScore: null,
      },

      sensorReadings,
      actuators,
      notifications: activeNotifications,
    });
  } catch (error) {
    console.error("[DASHBOARD_ROUTE_ERROR]", error);

    const message = error instanceof Error ? error.message : "Internal server error";
    if (message.toLowerCase().includes("token")) {
      return unauthorized(message);
    }
    return serverError(error);
  }
}
