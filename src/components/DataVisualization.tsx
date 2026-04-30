"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 mb-5">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => v.substring(0, 5)}
            minTickGap={40}
          />

          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
              padding: "8px 12px",
            }}
            formatter={(value) => [
              `${Number(value).toFixed(1)}${unit}`,
              title || dataKey,
            ]}
            labelFormatter={(label) => `Time: ${label}`}
            labelStyle={{ color: "#475569", marginBottom: "4px" }}
            cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
          />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
