"use client";

import { useState, useEffect } from "react";
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Sprout, 
  Volume2, 
  Flame, 
  Wifi, 
  WifiOff,
  RefreshCcw,
  Settings,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMqtt } from "@/lib/mqtt/useMqtt";
import { SensorCard, ActuatorControl } from "@/components/dashboard/DashboardComponents";

export default function Dashboard() {
  const { isConnected, lastData, setLastData } = useMqtt();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [controlLoading, setControlLoading] = useState<Record<string, boolean>>({});

  // Fetch initial state from database
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const res = await fetch('/api/telemetries/latest');
        if (res.ok) {
          const data = await res.json();
          if (data.telemetry) {
            // Robust parsing for properties (handles both object and stringified JSON)
            let props = data.telemetry.properties;
            if (typeof props === 'string') {
              try {
                props = JSON.parse(props);
              } catch (e) {
                console.error('[Dashboard] Failed to parse telemetry properties:', e);
              }
            }

            setLastData({
              temperature: data.telemetry.ambientTemperature,
              humidity: data.telemetry.humidity,
              light: data.telemetry.lightIntensity,
              soil_moisture: data.telemetry.soilMoisture,
              buzzer: props?.buzzer || 'OFF',
              mode: props?.buzzerMode || 'OFF',
              heater: props?.heater || 'OFF',
              timestamp: new Date(data.telemetry.timestamp).toLocaleTimeString(),
            });
          }
        }
      } catch (err) {
        console.error('[Dashboard] Failed to fetch initial state:', err);
      }
    };

    fetchInitialState();
  }, [setLastData]);

  const handleControl = async (actuator: 'buzzer' | 'heater', currentMode: string) => {
    setControlLoading(prev => ({ ...prev, [actuator]: true }));
    
    let command = '';
    if (actuator === 'buzzer') {
      // Toggle between AUTO and OFF
      command = currentMode === 'AUTO' ? 'OFF' : 'AUTO';
    } else {
      // Toggle between ON and OFF
      command = currentMode === 'ON' ? 'OFF' : 'ON';
    }

    // Optimization: If already in that state (rare but possible), skip
    if (command === currentMode) return;

    try {
      const res = await fetch(`/api/control/${actuator}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      
      if (!res.ok) throw new Error('Failed to send command');
      console.log(`[Dashboard] ${actuator} command sent: ${command}`);
    } catch (err) {
      console.error(`[Dashboard] Control error:`, err);
    } finally {
      // Simulate network delay for better UX
      setTimeout(() => {
        setControlLoading(prev => ({ ...prev, [actuator]: false }));
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-green-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Sprout size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Smart Farm Ecosystem</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Farm <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Intelligence</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
              <span className="text-sm font-bold uppercase">{isConnected ? 'Connected' : 'Offline'}</span>
            </div>
            <button 
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <SensorCard 
            title="Temperature"
            value={lastData?.temperature?.toFixed(1) || null}
            unit="°C"
            icon={Thermometer}
            color="bg-orange-500"
            description="Ambient temp in Greenhouse A"
            loading={isConnected}
          />
          <SensorCard 
            title="Humidity"
            value={lastData?.humidity?.toFixed(1) || null}
            unit="%"
            icon={Droplets}
            color="bg-blue-500"
            description="Air moisture levels"
            loading={isConnected}
          />
          <SensorCard 
            title="Soil Moisture"
            value={lastData?.soil_moisture?.toFixed(1) || null}
            unit="%"
            icon={Sprout}
            color="bg-emerald-500"
            description="Root zone hydration"
            loading={isConnected}
          />
          <SensorCard 
            title="Light Intensity"
            value={lastData?.light?.toFixed(0) || null}
            unit="lux"
            icon={Sun}
            color="bg-yellow-500"
            description="Solar radiation levels"
            loading={isConnected}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings className="text-green-400" size={20} />
                Control Center
              </h2>
              <div className="space-y-4">
                <ActuatorControl 
                  title="Buzzer System"
                  status={lastData?.mode === 'AUTO' ? `AUTO (${lastData?.buzzer || 'OFF'})` : 'MANUAL OFF'}
                  icon={Volume2}
                  color="bg-yellow-500"
                  onToggle={() => handleControl('buzzer', lastData?.mode || 'OFF')}
                  isLoading={controlLoading['buzzer']}
                />
                <ActuatorControl 
                  title="Climate Heater"
                  status={lastData?.heater || 'OFF'}
                  icon={Flame}
                  color="bg-orange-500"
                  onToggle={() => handleControl('heater', lastData?.heater || 'OFF')}
                  isLoading={controlLoading['heater']}
                />
              </div>
              
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20">
                <h3 className="font-bold text-green-400 text-sm uppercase tracking-wider mb-2">System Status</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  The automated irrigation system is currently in <span className="text-white font-medium">Monitoring Mode</span>. 
                  Threshold-based triggers are active.
                </p>
              </div>
            </div>
          </div>

          {/* Visualization Area (Mock for now) */}
          <div className="lg:col-span-2">
            <div className="h-full bg-white/5 rounded-[2rem] p-8 border border-white/10 backdrop-blur-xl flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <LayoutDashboard className="text-blue-400" size={20} />
                  Live Telemetry
                </h2>
                <span className="text-xs font-mono text-white/40">
                  Last update: {lastData?.timestamp || 'Waiting for data...'}
                </span>
              </div>
              
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="text-center relative z-10">
                  <div className="inline-flex p-4 rounded-full bg-blue-500/20 text-blue-400 mb-4">
                    <RefreshCcw size={32} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Real-time Analytics Coming Soon</h3>
                  <p className="text-sm text-white/40 max-w-xs mx-auto">
                    Historical charts and AI-driven growth predictions will be available in the next version.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 border-t border-white/5 text-center">
        <p className="text-xs text-white/20 uppercase tracking-[0.2em]">
          &copy; 2024 Yolo Farm Systems &bull; Powered by MQTT & Next.js
        </p>
      </footer>
    </div>
  );
}
