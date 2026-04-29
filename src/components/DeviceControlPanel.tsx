import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Flame, Bell, BellOff } from "lucide-react";
import { useState } from "react";

interface Device {
  id: string;
  name: string;
  icon: typeof Flame;
  status: boolean;
  description: string;
}

export function DeviceControlPanel() {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: "heating",
      name: "Heating Lamp",
      icon: Flame,
      status: true,
      description: "Temperature control",
    },
  ]);

  const [buzzerActive, setBuzzerActive] = useState(true);
  const [hasAlert, setHasAlert] = useState(true); // Simulate active alert

  const toggleDevice = (id: string) => {
    setDevices(
      devices.map((device) =>
        device.id === id ? { ...device, status: !device.status } : device
      )
    );
  };

  const turnOffBuzzer = () => {
    setBuzzerActive(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg text-gray-900 mb-4">Device Control Panel</h3>
      <div className="space-y-4">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    device.status ? "bg-green-100" : "bg-gray-200"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      device.status ? "text-green-600" : "text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-gray-900">{device.name}</p>
                  <p className="text-sm text-gray-500">{device.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`text-sm ${
                    device.status ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {device.status ? "ON" : "OFF"}
                </span>
                <Switch
                  checked={device.status}
                  onCheckedChange={() => toggleDevice(device.id)}
                />
              </div>
            </div>
          );
        })}

        {/* Buzzer Alert Control */}
        {hasAlert && buzzerActive && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-red-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Alert Buzzer</p>
                  <p className="text-sm text-red-600">Active - Disease detected</p>
                </div>
              </div>
            </div>
            <Button
              onClick={turnOffBuzzer}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Turn Off Buzzer
            </Button>
          </div>
        )}

        {hasAlert && !buzzerActive && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <BellOff className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-gray-900">Alert Buzzer</p>
                <p className="text-sm text-gray-500">Silenced</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}