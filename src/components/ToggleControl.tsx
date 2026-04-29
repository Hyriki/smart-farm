"use client";

import { useState } from "react";
import { Flame, Bell } from "lucide-react";

const DEVICE_ICONS: Record<string, React.ElementType> = {
  Heater: Flame,
  Buzzer: Bell,
};

interface ToggleControlProps {
  title: string;
  mode?: "auto-off" | "on-off";
  defaultState?: "auto" | "off" | "on";
  onChange?: (state: "auto" | "off" | "on") => void;
}

export function ToggleControl({
  title,
  mode = "auto-off",
  defaultState = "off",
  onChange,
}: ToggleControlProps) {
  const [state, setState] = useState<"auto" | "off" | "on">(defaultState);

  const handleToggle = () => {
    let newState: "auto" | "off" | "on";
    if (mode === "on-off") {
      newState = state === "off" ? "on" : "off";
    } else {
      newState = state === "off" ? "auto" : "off";
    }
    setState(newState);
    onChange?.(newState);
  };

  const isActive = state === "auto" || state === "on";
  const displayText =
    mode === "on-off"
      ? state === "on"
        ? "ON"
        : "OFF"
      : state === "auto"
        ? "AUTO"
        : "OFF";

  const Icon = DEVICE_ICONS[title];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              isActive ? "bg-emerald-50" : "bg-slate-100"
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                isActive ? "text-emerald-600" : "text-slate-400"
              }`}
              aria-hidden="true"
            />
          </div>
        )}
        <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-semibold transition-colors ${
            isActive ? "text-emerald-700" : "text-slate-400"
          }`}
        >
          {displayText}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`${title}: currently ${displayText}`}
          onClick={handleToggle}
          className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isActive
              ? "bg-emerald-500 focus-visible:ring-emerald-500"
              : "bg-slate-300 focus-visible:ring-slate-400"
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              isActive ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
