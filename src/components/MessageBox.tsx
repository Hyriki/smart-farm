"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  time: string;
  type: "info" | "warning";
}

export function MessageBox() {
  const [messages] = useState<Message[]>([
    {
      id: 1,
      text: "System online. All sensors connected.",
      time: "10:30 AM",
      type: "info",
    },
    {
      id: 2,
      text: "Temperature threshold reached. Heating lamp activated.",
      time: "11:45 AM",
      type: "warning",
    },
  ]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle
          className="w-4 h-4 text-slate-500"
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          System Messages
        </h3>
      </div>

      <div
        className="max-h-36 overflow-y-auto space-y-2"
        role="log"
        aria-label="System messages"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              message.type === "warning"
                ? "bg-amber-50 border-amber-100"
                : "bg-slate-50 border-slate-100"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                message.type === "warning" ? "bg-amber-500" : "bg-emerald-500"
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm text-slate-700">{message.text}</p>
              <p className="text-xs text-slate-400 mt-0.5">{message.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
