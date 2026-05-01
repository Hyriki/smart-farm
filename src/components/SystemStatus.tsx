"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Wifi, Cpu, CheckCircle, AlertTriangle } from "lucide-react";

type Status = "online" | "offline" | "warning";

interface StatusItem {
  id: string;
  name: string;
  icon: typeof Wifi;
  status: Status;
  lastUpdate: string;
}

type SensorReading = {
  sensorId: number;
  status: string;
  latest: { timestamp: string } | null;
};

function formatRelative(iso: string | null): string {
  if (!iso) return "no data yet";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SystemStatus() {
  const [items, setItems] = useState<StatusItem[]>([
    { id: "gateway", name: "Gateway Connection", icon: Wifi, status: "offline", lastUpdate: "—" },
    { id: "sensors", name: "Sensor Node Status", icon: Cpu, status: "offline", lastUpdate: "—" },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/dashboard", {
          cache: "no-store",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("dashboard fetch failed");
        const data = await res.json();

        const readings: SensorReading[] = data.sensorReadings ?? [];
        const latestTs =
          readings
            .map((r) => r.latest?.timestamp)
            .filter((t): t is string => !!t)
            .sort()
            .reverse()[0] ?? null;

        // Sensor node = at least one sensor row whose status != offline AND a
        // recent telemetry (< 30s) ⇒ live; 30s–5min ⇒ warning; older ⇒ offline.
        const ageMs = latestTs ? Date.now() - new Date(latestTs).getTime() : Infinity;
        const sensorStatus: Status =
          ageMs < 30_000 ? "online" : ageMs < 5 * 60_000 ? "warning" : "offline";

        // Gateway = backend-reachable + at least one telemetry ever ⇒ online.
        const gatewayStatus: Status = latestTs ? "online" : "warning";

        if (!cancelled) {
          setItems([
            {
              id: "gateway",
              name: "Gateway Connection",
              icon: Wifi,
              status: gatewayStatus,
              lastUpdate: latestTs ? formatRelative(latestTs) : "no data yet",
            },
            {
              id: "sensors",
              name: "Sensor Node Status",
              icon: Cpu,
              status: sensorStatus,
              lastUpdate: formatRelative(latestTs),
            },
          ]);
        }
      } catch {
        if (!cancelled) {
          setItems((prev) =>
            prev.map((i) => ({ ...i, status: "offline", lastUpdate: "unreachable" })),
          );
        }
      }
    }

    refresh();
    const t = setInterval(refresh, 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "online":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-0 font-medium">
            <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            Online
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-0 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" aria-hidden="true" />
            Warning
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-100 text-red-700 border-0 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" aria-hidden="true" />
            Offline
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
        System Status
      </h3>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon
                    className="w-4 h-4 text-slate-500"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">{item.lastUpdate}</p>
                </div>
              </div>
              {getStatusBadge(item.status)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
