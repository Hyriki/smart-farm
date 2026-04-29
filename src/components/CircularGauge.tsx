interface CircularGaugeProps {
  title: string;
  value: number;
  unit: string;
  maxValue: number;
  color?: string;
}

export function CircularGauge({
  title,
  value,
  unit,
  maxValue,
  color = "#22c55e",
}: CircularGaugeProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeMaxValue = maxValue > 0 ? maxValue : 100;

  const percentage = Math.min(
    Math.max((safeValue / safeMaxValue) * 100, 0),
    100
  );

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const displayValue = safeValue.toFixed(2);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
      <h3 className="text-gray-900 text-lg mb-4 font-medium">{title}</h3>

      <div className="relative w-48 h-48 mx-auto">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />

          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{ filter: "drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="max-w-full truncate text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {displayValue}
          </span>
          <span className="text-lg text-gray-500 mt-1">{unit}</span>
        </div>

        {/* Min/Max labels */}
        <div className="absolute bottom-4 left-4 text-gray-400 text-sm">0</div>
        <div className="absolute bottom-4 right-4 text-gray-400 text-sm">
          {safeMaxValue}
        </div>
      </div>
    </div>
  );
}