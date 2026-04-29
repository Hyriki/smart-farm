"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { CircularGauge } from "@/components/CircularGauge";
import { ToggleControl } from "@/components/ToggleControl";
import { AIDetectionPanel } from "@/components/AIDetectionPanel";
import { DataVisualization } from "@/components/DataVisualization";
import { SystemStatus } from "@/components/SystemStatus";
import { MessageBox } from "@/components/MessageBox";

type ControlState = "auto" | "off" | "on";

type TrendPoint = {
  time: string;
  value: number;
};

type Detection = {
  label: string;
  confidence: number;
  status: "healthy" | "disease";
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type DashboardStats = {
  sensors?: number;
  activeSensors?: number;
  actuators?: number;
  devicesOnline?: number;
  telemetries?: number;
  alerts?: number;
  frames?: number;
  plantsMonitored?: number | null;
  healthScore?: number | null;
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
  ai: {
    imageUrl: string;
    detections: Detection[];
  };
  stats: DashboardStats;
};

export default function DashboardPage() {
  const [heaterState, setHeaterState] = useState<ControlState>("off");
  const [buzzerState, setBuzzerState] = useState<ControlState>("auto");

  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(
    null
  );
  const [currentSoilMoisture, setCurrentSoilMoisture] = useState<number | null>(
    null
  );

  const [lightTrend, setLightTrend] = useState<TrendPoint[]>([]);
  const [temperatureTrend, setTemperatureTrend] = useState<TrendPoint[]>([]);
  const [moistureTrend, setMoistureTrend] = useState<TrendPoint[]>([]);

  const [plantImageUrl, setPlantImageUrl] = useState<string>("");
  const [detections, setDetections] = useState<Detection[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    sensors: undefined,
    activeSensors: undefined,
    actuators: undefined,
    devicesOnline: undefined,
    telemetries: undefined,
    alerts: undefined,
    frames: undefined,
    plantsMonitored: null,
    healthScore: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch("/api/dashboard", {
          cache: "no-store",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data: DashboardData = await response.json();

        setCurrentHumidity(data.current?.humidity ?? null);
        setCurrentTemperature(data.current?.temperature ?? null);
        setCurrentSoilMoisture(data.current?.soilMoisture ?? null);

        setLightTrend(data.trends?.light ?? []);
        setTemperatureTrend(data.trends?.temperature ?? []);
        setMoistureTrend(data.trends?.moisture ?? []);

        setPlantImageUrl(data.ai?.imageUrl ?? "");
        setDetections(data.ai?.detections ?? []);

        setStats(data.stats ?? {});
      } catch (error) {
        console.error("[LOAD_DASHBOARD_DATA_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <TopNav />

      <main className="pt-16 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600">
            Monitor your smart farm in real-time with AI-powered insights
          </p>
        </div>

        {/* System Messages */}
        <section className="mb-8">
          <MessageBox />
        </section>

        {/* Sensor Gauges and Controls - Top Row */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Environmental Monitoring & Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CircularGauge
              title="Humidity"
              value={currentHumidity ?? 0}
              unit="%"
              maxValue={100}
              color="#22c55e"
            />

            <ToggleControl
              title="Heater"
              mode="on-off"
              defaultState={heaterState}
              onChange={setHeaterState}
            />

            <CircularGauge
              title="Temperature"
              value={currentTemperature ?? 0}
              unit="C"
              maxValue={100}
              color="#22c55e"
            />

            <CircularGauge
              title="Soil Moisture"
              value={currentSoilMoisture ?? 0}
              unit="%"
              maxValue={100}
              color="#22c55e"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div></div>
            <ToggleControl
              title="Buzzer"
              mode="auto-off"
              defaultState={buzzerState}
              onChange={setBuzzerState}
            />
          </div>
        </section>

        {/* Light Intensity Chart */}
        <section className="mb-8">
          <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-gray-900 text-lg mb-4 font-medium">
              Light Intensity
            </h3>

            {lightTrend.length > 0 ? (
              <DataVisualization
                title=""
                data={lightTrend}
                dataKey="value"
                color="#22c55e"
                unit=" lux"
              />
            ) : (
              <EmptyState
                isLoading={isLoading}
                message="No light intensity data available yet."
              />
            )}
          </div>
        </section>

        {/* AI Detection and System Status */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            AI Plant Detection & System Status
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plantImageUrl ? (
              <AIDetectionPanel
                imageUrl={plantImageUrl}
                detections={detections}
              />
            ) : (
              <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
                <h3 className="text-gray-900 text-lg mb-4 font-medium">
                  AI Plant Detection
                </h3>
                <EmptyState
                  isLoading={isLoading}
                  message="No plant image or detection data available yet."
                />
              </div>
            )}

            <SystemStatus />
          </div>
        </section>

        {/* Data Trends */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Historical Data Trends
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {temperatureTrend.length > 0 ? (
              <DataVisualization
                title="Temperature Trend"
                data={temperatureTrend}
                dataKey="value"
                color="#ef4444"
                unit="°C"
              />
            ) : (
              <EmptyChartCard
                title="Temperature Trend"
                isLoading={isLoading}
                message="No temperature history available yet."
              />
            )}

            {moistureTrend.length > 0 ? (
              <DataVisualization
                title="Soil Moisture Over Time"
                data={moistureTrend}
                dataKey="value"
                color="#3b82f6"
                unit="%"
              />
            ) : (
              <EmptyChartCard
                title="Soil Moisture Over Time"
                isLoading={isLoading}
                message="No soil moisture history available yet."
              />
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-8">
          <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Stats
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Active Sensors"
                value={stats.activeSensors ?? stats.sensors ?? null}
                suffix=""
                gradient="from-green-600 to-green-500"
              />

              <StatCard
                label="Devices Online"
                value={stats.devicesOnline ?? stats.actuators ?? null}
                suffix=""
                gradient="from-blue-600 to-blue-500"
              />

              <StatCard
                label="Alerts"
                value={stats.alerts ?? null}
                suffix=""
                gradient="from-purple-600 to-purple-500"
              />

              <StatCard
                label="Health Score"
                value={stats.healthScore ?? null}
                suffix="%"
                gradient="from-green-600 to-green-500"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  gradient,
}: {
  label: string;
  value: number | null;
  suffix: string;
  gradient: string;
}) {
  return (
    <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-lg rounded-xl p-6 border border-white/30 shadow-md hover:shadow-xl transition-shadow">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p
        className={`text-3xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}
      >
        {value === null ? "—" : `${value}${suffix}`}
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
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
      <h3 className="text-gray-900 text-lg mb-4 font-medium">{title}</h3>
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
    <div className="min-h-[220px] flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/40">
      <p className="text-sm text-gray-500">
        {isLoading ? "Loading data..." : message}
      </p>
    </div>
  );
}