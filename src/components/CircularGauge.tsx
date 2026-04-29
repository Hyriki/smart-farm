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
  color = "#10b981",
}: CircularGaugeProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeMaxValue = maxValue > 0 ? maxValue : 100;

  const percentage = Math.min(Math.max((safeValue / safeMaxValue) * 100, 0), 100);

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const displayValue =
    safeValue % 1 === 0 ? safeValue.toString() : safeValue.toFixed(1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
        {title}
      </h3>

      <div className="relative w-40 h-40 mx-auto">
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="14"
          />
          {/* Progress */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>

        {/* Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-3xl font-bold text-slate-900 tabular-nums leading-none"
            aria-label={`${displayValue} ${unit}`}
          >
            {displayValue}
          </span>
          <span className="text-sm text-slate-400 mt-1">{unit}</span>
        </div>
      </div>

      {/* Min / max */}
      <div className="flex justify-between mt-3 text-xs text-slate-400 px-2">
        <span>0</span>
        <span>{safeMaxValue}</span>
      </div>
    </div>
  );
}
