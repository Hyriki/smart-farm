import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api";
import { getLatestSensorSnapshot } from "@/lib/mqtt/sensorDataHandler";

// Always run on every request; never get statically optimized by Turbopack/Next.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

type TrendPoint = { time: string; value: number };
type Trends = { light: TrendPoint[]; temperature: TrendPoint[]; moisture: TrendPoint[] };
const EMPTY_TRENDS: Trends = { light: [], temperature: [], moisture: [] };
const EMPTY_STATS = {
  sensors: 0,
  activeSensors: 0,
  actuators: 0,
  devicesOnline: 0,
  telemetries: 0,
  alerts: 0,
};

export async function GET(request: Request) {
  try {
    requireAuth(request);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unauthorized";
    return unauthorized(msg);
  }

  // Always populate `current` from the in-memory cache first — page reload sees
  // last known values within a microsecond, no DB hop.
  const snap = getLatestSensorSnapshot();
  const current = {
    humidity: snap.humidity,
    temperature: snap.temperature,
    soilMoisture: snap.soil_moisture,
    lightIntensity: snap.light,
  };
  const lastUpdated = snap.lastUpdated;

  // Heavy bits — wrapped per-section so a single failing query degrades to
  // a sane default instead of a 500. Reload never returns "Failed to fetch".
  let stats = EMPTY_STATS;
  let trends: Trends = EMPTY_TRENDS;
  let actuators: Array<{
    id: number;
    role: string;
    currentState: string;
    mode: string | null;
    updatedAt: Date;
  }> = [];
  let activeNotifications: unknown[] = [];
  let sensorReadings: Array<{
    sensorId: number;
    sensorType: string;
    location: string | null;
    status: string;
    latest: { timestamp: Date } | null;
  }> = [];

  try {
    const [
      sensorCount,
      activeSensorCount,
      actuatorCount,
      devicesOnline,
      telemetryCount,
      alertCount,
      latestTelemetries,
      recentTelemetries,
    ] = await Promise.all([
      prisma.sensor.count(),
      prisma.sensor.count({ where: { status: "online" } }),
      prisma.actuator.count(),
      prisma.actuator.count({ where: { currentState: { not: "OFF" } } }),
      prisma.telemetry.count(),
      prisma.alert.count(),
      prisma.sensor.findMany({
        select: {
          id: true,
          type: true,
          location: true,
          status: true,
          telemetries: {
            orderBy: { timestamp: "desc" },
            take: 1,
            select: { timestamp: true },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.telemetry.findMany({
        orderBy: { timestamp: "desc" },
        take: 12,
        select: {
          timestamp: true,
          lightIntensity: true,
          ambientTemperature: true,
          soilMoisture: true,
        },
      }),
    ]);

    stats = {
      sensors: sensorCount,
      activeSensors: activeSensorCount,
      actuators: actuatorCount,
      devicesOnline,
      telemetries: telemetryCount,
      alerts: alertCount,
    };

    sensorReadings = latestTelemetries.map((sensor) => ({
      sensorId: sensor.id,
      sensorType: sensor.type,
      location: sensor.location,
      status: sensor.status,
      latest: sensor.telemetries[0] ?? null,
    }));

    const ordered = [...recentTelemetries].reverse();
    trends = {
      light: ordered.map((t) => ({
        time: formatTime(t.timestamp),
        value: t.lightIntensity ?? 0,
      })),
      temperature: ordered.map((t) => ({
        time: formatTime(t.timestamp),
        value: t.ambientTemperature ?? 0,
      })),
      moisture: ordered.map((t) => ({
        time: formatTime(t.timestamp),
        value: t.soilMoisture ?? 0,
      })),
    };
  } catch (err) {
    console.error("[DASHBOARD] stats/trends query failed — serving cached/defaults:", err);
  }

  try {
    actuators = await prisma.$queryRaw`
      SELECT "id", "role", "currentState", "mode", "updatedAt"
      FROM   "Actuator"
      ORDER  BY "id" ASC
    `;
  } catch (err) {
    console.error("[DASHBOARD] actuators query failed:", err);
    try {
      const rows = await prisma.actuator.findMany({
        select: { id: true, role: true, currentState: true, updatedAt: true },
        orderBy: { id: "asc" },
      });
      actuators = rows.map((r) => ({ ...r, mode: null }));
    } catch {
      actuators = [];
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = prisma as any;
    if (pc.notification) {
      activeNotifications = await pc.notification.findMany({
        where: { isResolved: false },
        orderBy: { updatedAt: "desc" },
      });
    }
  } catch (err) {
    console.error("[DASHBOARD] notifications query failed:", err);
    activeNotifications = [];
  }

  return ok({
    message: "Dashboard data fetched successfully",
    current,
    lastUpdated,
    trends,
    stats,
    sensorReadings,
    actuators,
    notifications: activeNotifications,
  });
}
