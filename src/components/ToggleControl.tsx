import { useState } from "react";

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
  const displayText = mode === "on-off" ? (state === "on" ? "ON" : "OFF") : (state === "auto" ? "AUTO" : "OFF");

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
      <h3 className="text-gray-900 text-lg mb-4 font-medium">{title}</h3>
      <div className="flex justify-center">
        <button
          onClick={handleToggle}
          className={`relative w-32 h-16 rounded-full transition-all duration-300 shadow-inner ${
            isActive
              ? "bg-gradient-to-r from-green-400 to-green-500"
              : "bg-gradient-to-r from-red-400 to-red-500"
          }`}
        >
          <div
            className={`absolute top-2 w-12 h-12 bg-white rounded-full shadow-lg transition-all duration-300 ${
              isActive ? "left-2" : "left-[72px]"
            }`}
          />
          <span
            className={`absolute top-1/2 -translate-y-1/2 font-bold text-white text-sm transition-all duration-300 ${
              isActive ? "right-4" : "left-4"
            }`}
          >
            {displayText}
          </span>
        </button>
      </div>
    </div>
  );
}