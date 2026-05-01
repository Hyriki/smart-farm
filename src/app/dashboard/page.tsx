"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, mapApiNotification } from "@/lib/notifications";
import { TopNav } from "@/components/TopNav";
import { CircularGauge } from "@/components/CircularGauge";
import { DataVisualization } from "@/components/DataVisualization";
import { SystemStatus } from "@/components/SystemStatus";
import { Cpu, Wifi, Bell, Activity, Flame } from "lucide-react";

type TrendPoint = {
  time: string;
  value: number;
};

type DashboardStats = {
  sensors?: number;
  activeSensors?: number;
  actuators?: number;
  devicesOnline?: number;
  telemetries?: number;
  alerts?: number;
  frames?: number;
};

type ActuatorData = {
  id: number;
  role: string;
  currentState: string;
  mode?: string | null; // buzzer only: "AUTO" | "OFF"
};

type ApiNotification = {
  id: number;
  sensorKey: string;
  type: string;
  message: string;
  sensorName: string;
  currentValue: number;
  threshold: number;
  unit: string;
  updatedAt: string;
};

type DashboardData = {
  current: {
    humidity: number | null;
    temperature: number | null;
    soilMoisture: number | null;
    lightIntensity: number | null;
  };
  trends: {
    light: TrendPoint[];
    temperature: TrendPoint[];
    moisture: TrendPoint[];
  };
  stats: DashboardStats;
  actuators?: ActuatorData[];
  notifications?: ApiNotification[];
};

export default function DashboardPage() {
  const router = useRouter();

  // Heater
  const [heaterActuatorId, setHeaterActuatorId] = useState<number | null>(null);
  const [heaterState, setHeaterState] = useState<"ON" | "OFF">("OFF");

  // Buzzer: mode (AUTO/OFF) and actual hardware state (ON/OFF)
  const [buzzerActuatorId, setBuzzerActuatorId] = useState<number | null>(null);
  const [buzzerMode, setBuzzerMode] = useState<"AUTO" | "OFF">("OFF");
  const [buzzerRealState, setBuzzerRealState] = useState<"ON" | "OFF">("OFF");

  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(null);
  const [currentSoilMoisture, setCurrentSoilMoisture] = useState<number | null>(null);
  const [currentLightIntensity, setCurrentLightIntensity] = useState<number | null>(null);

  const [lightTrend, setLightTrend] = useState<TrendPoint[]>([]);
  const [temperatureTrend, setTemperatureTrend] = useState<TrendPoint[]>([]);
  const [moistureTrend, setMoistureTrend] = useState<TrendPoint[]>([]);

  const [stats, setStats] = useState<DashboardStats>({});
  const [isLoading, setIsLoading] = useState(true);

  const { setNotifications } = useNotifications();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch("/api/dashboard", {
          cache: "no-store",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Self-heal expired-session: stale localStorage.isAuthenticated may keep
        // the user on /dashboard even after the JWT cookie has expired. Redirect.
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("token");
          }
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          const body = await response.text().catch(() => "<unreadable body>");
          console.error(
            `[LOAD_DASHBOARD_DATA] HTTP ${response.status} ${response.statusText} — body:`,
            body,
          );
          throw new Error(`Failed to fetch dashboard data (HTTP ${response.status})`);
        }

        const data: DashboardData = await response.json();

        setCurrentHumidity(data.current?.humidity ?? null);
        setCurrentTemperature(data.current?.temperature ?? null);
        setCurrentSoilMoisture(data.current?.soilMoisture ?? null);
        setCurrentLightIntensity(data.current?.lightIntensity ?? null);

        setLightTrend(data.trends?.light ?? []);
        setTemperatureTrend(data.trends?.temperature ?? []);
        setMoistureTrend(data.trends?.moisture ?? []);

        setStats(data.stats ?? {});

        // Initialize actuator state from API
        const actuators = data.actuators ?? [];

        const heaterActuator = actuators.find((a) => a.role === "heater");
        if (heaterActuator) {
          setHeaterActuatorId(heaterActuator.id);
          setHeaterState(heaterActuator.currentState === "ON" ? "ON" : "OFF");
        }

        const buzzerActuator = actuators.find((a) => a.role === "buzzer");
        if (buzzerActuator) {
          setBuzzerActuatorId(buzzerActuator.id);
          setBuzzerMode(buzzerActuator.mode === "AUTO" ? "AUTO" : "OFF");
        }

        // Seed context with notifications from initial dashboard load
        if (data.notifications) {
          setNotifications(data.notifications.map(mapApiNotification));
        }
      } catch (error) {
        console.error("[LOAD_DASHBOARD_DATA_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchBuzzerRealState() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/actuators/runtime", {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setBuzzerRealState(data.buzzerState as "ON" | "OFF");
        }
      } catch {
        // silent — badge just stays stale
      }
    }

    async function fetchNotifications() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/notifications", {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications((data.notifications ?? []).map(mapApiNotification));
        }
      } catch {
        // silent
      }
    }

    loadDashboardData();
    fetchBuzzerRealState(); // initial value before SSE delivers the first push
    fetchNotifications();

    const notifInterval = setInterval(fetchNotifications, 10000);
    // Trends/stats only need slow refresh; SSE handles the live gauges + buzzer.
    const slowRefresh = setInterval(loadDashboardData, 30000);

    return () => {
      clearInterval(notifInterval);
      clearInterval(slowRefresh);
    };
  }, [setNotifications, router]);

  // ─── Real-time push via SSE ────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource | null = null;
    let retryHandle: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      es = new EventSource("/api/dashboard/stream", { withCredentials: true });

      es.addEventListener("snapshot", (ev) => {
        try {
          const snap = JSON.parse((ev as MessageEvent).data) as {
            humidity: number | null;
            temperature: number | null;
            soil_moisture: number | null;
            light: number | null;
            buzzerMode: "AUTO" | "OFF";
            buzzerState: "ON" | "OFF";
            heaterState: "ON" | "OFF";
            lastUpdated: string | null;
          };
          if (snap.humidity !== null) setCurrentHumidity(snap.humidity);
          if (snap.temperature !== null) setCurrentTemperature(snap.temperature);
          if (snap.soil_moisture !== null) setCurrentSoilMoisture(snap.soil_moisture);
          if (snap.light !== null) setCurrentLightIntensity(snap.light);
          setBuzzerRealState(snap.buzzerState);
          setBuzzerMode(snap.buzzerMode);
          setHeaterState(snap.heaterState);
        } catch (err) {
          console.error("[SSE] failed to parse snapshot", err);
        }
      });

      es.onerror = () => {
        // Browser auto-reconnects; close + retry only if the stream stays broken.
        es?.close();
        es = null;
        if (!cancelled) {
          retryHandle = setTimeout(connect, 3000);
        }
      };
    }

    connect();
    return () => {
      cancelled = true;
      if (retryHandle) clearTimeout(retryHandle);
      es?.close();
    };
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50">
      <TopNav />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500">
              Monitor your smart farm in real-time
            </p>
          </div>

          {/* Quick Stats */}
          <section aria-label="Quick statistics" className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Active Sensors"
                value={stats.activeSensors ?? stats.sensors ?? null}
                suffix=""
                icon={Cpu}
                iconBg="bg-emerald-500"
              />
              <StatCard
                label="Devices Online"
                value={stats.devicesOnline ?? stats.actuators ?? null}
                suffix=""
                icon={Wifi}
                iconBg="bg-blue-500"
              />
              <StatCard
                label="Alerts"
                value={stats.alerts ?? null}
                suffix=""
                icon={Bell}
                iconBg="bg-amber-500"
              />
              <StatCard
                label="Data Points"
                value={stats.telemetries ?? null}
                suffix=""
                icon={Activity}
                iconBg="bg-violet-500"
              />
            </div>
          </section>

          {/* Environmental Monitoring */}
          <section aria-label="Environmental monitoring" className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Environmental Monitoring
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <CircularGauge
                title="Humidity"
                value={currentHumidity ?? 0}
                unit="%"
                maxValue={100}
                color="#10b981"
              />
              <CircularGauge
                title="Temperature"
                value={currentTemperature ?? 0}
                unit="°C"
                maxValue={60}
                color="#ef4444"
              />
              <CircularGauge
                title="Soil Moisture"
                value={currentSoilMoisture ?? 0}
                unit="%"
                maxValue={100}
                color="#3b82f6"
              />
              <CircularGauge
                title="Light Intensity"
                value={currentLightIntensity ?? 0}
                unit="lux"
                maxValue={10000}
                color="#f59e0b"
              />
            </div>
          </section>

          {/* Device Controls */}
          <section aria-label="Device controls" className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Device Controls
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <HeaterCard
                actuatorId={heaterActuatorId}
                state={heaterState}
                onToggle={setHeaterState}
              />

              {/* Buzzer uses a dedicated card that shows both mode and real state */}
              <BuzzerCard
                actuatorId={buzzerActuatorId}
                mode={buzzerMode}
                realState={buzzerRealState}
                onToggle={(newMode, newState) => {
                  setBuzzerMode(newMode);
                  setBuzzerRealState(newState);
                }}
              />
            </div>
          </section>

          {/* Light Intensity Chart */}
          <section aria-label="Light intensity chart" className="mb-8">
            {lightTrend.length > 0 ? (
              <DataVisualization
                title="Light Intensity"
                data={lightTrend}
                dataKey="value"
                color="#f59e0b"
                unit=" lux"
              />
            ) : (
              <EmptyChartCard
                title="Light Intensity"
                isLoading={isLoading}
                message="No light intensity data available yet."
              />
            )}
          </section>

          {/* Historical Data Trends */}
          <section aria-label="Historical data trends" className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Historical Trends
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {temperatureTrend.length > 0 ? (
                <DataVisualization
                  title="Temperature"
                  data={temperatureTrend}
                  dataKey="value"
                  color="#ef4444"
                  unit="°C"
                />
              ) : (
                <EmptyChartCard
                  title="Temperature"
                  isLoading={isLoading}
                  message="No temperature history available yet."
                />
              )}

              {moistureTrend.length > 0 ? (
                <DataVisualization
                  title="Soil Moisture"
                  data={moistureTrend}
                  dataKey="value"
                  color="#3b82f6"
                  unit="%"
                />
              ) : (
                <EmptyChartCard
                  title="Soil Moisture"
                  isLoading={isLoading}
                  message="No soil moisture history available yet."
                />
              )}
            </div>
          </section>

          {/* System Status */}
          <section aria-label="System status" className="mb-8">
            <SystemStatus />
          </section>

        </div>
      </main>
    </div>
  );
}

// ─── Heater Card ──────────────────────────────────────────────────────────────

function HeaterCard({
  actuatorId,
  state,
  onToggle,
}: {
  actuatorId: number | null;
  state: "ON" | "OFF";
  onToggle: (state: "ON" | "OFF") => void;
}) {
  const [isToggling, setIsToggling] = useState(false);
  const isActive = state === "ON";

  const handleToggle = async () => {
    if (actuatorId === null || isToggling) return;
    setIsToggling(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`/api/actuators/${actuatorId}/toggle`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentState: state }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.actuator) {
        onToggle(data.actuator.currentState === "ON" ? "ON" : "OFF");
        if (data.warning) console.warn("[HeaterCard] MQTT skipped:", data.warning);
      } else {
        console.error(`[HeaterCard] Toggle failed — status ${res.status}:`, data);
      }
    } catch (err) {
      console.error("[HeaterCard] Toggle error:", err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? "bg-emerald-50" : "bg-slate-100"
            }`}
        >
          <Flame
            className={`w-5 h-5 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400"
              }`}
            aria-hidden="true"
          />
        </div>
        <h3 className="text-base font-semibold text-slate-700">Heater</h3>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-semibold ${isActive ? "text-emerald-700" : "text-slate-400"
            }`}
        >
          {isActive ? "ON" : "OFF"}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`Heater: currently ${isActive ? "ON" : "OFF"}`}
          disabled={isToggling || actuatorId === null}
          onClick={handleToggle}
          className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${isActive
              ? "bg-emerald-500 focus-visible:ring-emerald-500"
              : "bg-slate-300 focus-visible:ring-slate-400"
            }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isToggling ? "opacity-60" : ""
              } ${isActive ? "translate-x-6" : "translate-x-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Buzzer Card ───────────────────────────────────────────────────────────────
// Shows buzzerMode toggle (AUTO ↔ OFF) and the real hardware state when in AUTO.

function BuzzerCard({
  actuatorId,
  mode,
  realState,
  onToggle,
}: {
  actuatorId: number | null;
  mode: "AUTO" | "OFF";
  realState: "ON" | "OFF";
  onToggle: (mode: "AUTO" | "OFF", state: "ON" | "OFF") => void;
}) {
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (actuatorId === null || isToggling) return;
    setIsToggling(true);
    setToggleError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`/api/actuators/${actuatorId}/toggle`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.buzzerMode !== undefined) {
        const newMode: "AUTO" | "OFF" = data.buzzerMode === "AUTO" ? "AUTO" : "OFF";
        const newState: "ON" | "OFF" = data.buzzerState === "ON" ? "ON" : "OFF";
        onToggle(newMode, newState);
        if (data.warning) {
          console.warn("[BuzzerCard] MQTT skipped:", data.warning);
        }
      } else {
        const errMsg = data?.error ?? `HTTP ${res.status}`;
        console.error(`[BuzzerCard] Toggle failed — status ${res.status}:`, data);
        setToggleError(errMsg.includes("migration") ? "DB not migrated" : "Toggle failed");
      }
    } catch (err) {
      console.error("[BuzzerCard] Toggle error:", err);
      setToggleError("Network error");
    } finally {
      setIsToggling(false);
    }
  };

  const isActive = mode === "AUTO";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? "bg-emerald-50" : "bg-slate-100"
            }`}
        >
          <Bell
            className={`w-5 h-5 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400"
              }`}
            aria-hidden="true"
          />
        </div>
        <h3 className="text-base font-semibold text-slate-700">Buzzer</h3>
      </div>

      {toggleError && (
        <p className="text-xs text-red-600 mb-3 font-medium">{toggleError}</p>
      )}

      <div className="flex items-center justify-between">
        {/* Left: mode label + real-state badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-sm font-semibold ${
              isActive ? "text-emerald-700" : "text-slate-400"
            }`}
          >
            {mode}
          </span>

          {mode === "AUTO" && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                realState === "ON"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {realState === "ON" ? "ON" : "Silent"}
            </span>
          )}
        </div>

        {/* Right: toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`Buzzer mode: currently ${mode}${mode === "AUTO" ? `, hardware ${realState}` : ""}`}
          disabled={isToggling || actuatorId === null}
          onClick={handleToggle}
          className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${isActive
              ? "bg-emerald-500 focus-visible:ring-emerald-500"
              : "bg-slate-300 focus-visible:ring-slate-400"
            }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isToggling ? "opacity-60" : ""
              } ${isActive ? "translate-x-6" : "translate-x-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Shared helper components ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: number | null;
  suffix: string;
  icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <div
          className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">
        {value === null ? (
          <span className="text-slate-300">—</span>
        ) : (
          `${value}${suffix}`
        )}
      </p>
    </div>
  );
}

function EmptyChartCard({
  title,
  message,
  isLoading,
}: {
  title: string;
  message: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      )}
      <EmptyState isLoading={isLoading} message={message} />
    </div>
  );
}

function EmptyState({
  message,
  isLoading,
}: {
  message: string;
  isLoading: boolean;
}) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
      {isLoading ? (
        <>
          <div
            className="w-7 h-7 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-3"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-400">Loading data...</p>
        </>
      ) : (
        <p className="text-sm text-slate-400">{message}</p>
      )}
    </div>
  );
}
