import { Card } from "./ui/card";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  time: string;
  sender: "system";
}

export function MessageBox() {
  const [messages] = useState<Message[]>([
    {
      id: 1,
      text: "System online. All sensors connected.",
      time: "10:30 AM",
      sender: "system",
    },
    {
      id: 2,
      text: "Temperature threshold reached. Heating lamp activated.",
      time: "11:45 AM",
      sender: "system",
    },
    {
      id: 3,
      text: "Alert: Leaf Spot Disease detected on Plant #23. Buzzer activated.",
      time: "12:15 PM",
      sender: "system",
    },
  ]);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <MessageCircle className="w-5 h-5 text-green-600" />
        <h3 className="text-lg text-gray-900 font-medium">System Messages</h3>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-lg p-4 max-h-32 overflow-y-auto space-y-2 border border-white/20">
        {messages.map((message) => (
          <div key={message.id} className="flex justify-start">
            <div className="rounded-lg p-3 bg-white/60 backdrop-blur-sm text-gray-900 w-full border border-white/30 shadow-sm">
              <p className="text-sm">{message.text}</p>
              <p className="text-xs mt-1 text-gray-500">{message.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}