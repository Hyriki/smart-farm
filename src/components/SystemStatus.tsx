import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Wifi, Cpu, Eye, CheckCircle, AlertTriangle } from "lucide-react";

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
    {
      id: "ai",
      name: "AI Detection Status",
      icon: Eye,
      status: "online",
      lastUpdate: "5 min ago",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Online
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg text-gray-900 mb-4 font-medium">System Status</h3>
      <div className="space-y-3">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-md rounded-lg border border-white/20"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.lastUpdate}</p>
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