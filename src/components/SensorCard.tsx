import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SensorCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  data: Array<{ value: number }>;
}

export function SensorCard({
  icon: Icon,
  title,
  value,
  unit,
  status,
  data,
}: SensorCardProps) {
  const statusColors = {
    normal: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    critical: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    normal: "Normal",
    warning: "Warning",
    critical: "Critical",
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl text-gray-900">{value}</span>
              <span className="text-sm text-gray-500">{unit}</span>
            </div>
          </div>
        </div>
        <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
      </div>

      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
