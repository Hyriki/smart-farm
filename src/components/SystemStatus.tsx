import { Badge } from "./ui/badge";
import { Wifi, Cpu, CheckCircle, AlertTriangle } from "lucide-react";

interface StatusItem {
  id: string;
  name: string;
  icon: typeof Wifi;
  status: "online" | "offline" | "warning";
  lastUpdate: string;
}

export function SystemStatus() {
  const statusItems: StatusItem[] = [
    {
      id: "gateway",
      name: "Gateway Connection",
      icon: Wifi,
      status: "online",
      lastUpdate: "Just now",
    },
    {
      id: "sensors",
      name: "Sensor Node Status",
      icon: Cpu,
      status: "online",
      lastUpdate: "2 min ago",
    },
  ];

  const getStatusBadge = (status: string) => {
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
        {statusItems.map((item) => {
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
