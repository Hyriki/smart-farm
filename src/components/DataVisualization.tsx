"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataVisualizationProps {
  title: string;
  data: Array<{ time: string; value: number }>;
  dataKey: string;
  color: string;
  unit: string;
}

export function DataVisualization({
  title,
  data,
  dataKey,
  color,
  unit,
}: DataVisualizationProps) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
      {title && (
        <h3 className="text-lg text-gray-900 mb-4 font-medium">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
            }}
            formatter={(value) => [`${Number(value)}${unit}`, dataKey]}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={false}
            name={title || dataKey}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}