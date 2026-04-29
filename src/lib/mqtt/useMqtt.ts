"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  light: number | null;
  soil_moisture: number | null;
  buzzer: 'ON' | 'OFF';
  mode: 'AUTO' | 'OFF';
  heater: 'ON' | 'OFF';
  timestamp?: string;
}

export function useMqtt() {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastData, setLastData] = useState<SensorData | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mqttFailed = useRef(false);

  // Fallback: poll the REST API for latest telemetry when MQTT is unavailable
  const pollLatestData = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetries/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          let props = data.telemetry.properties;
          if (typeof props === 'string') {
            try { props = JSON.parse(props); } catch { /* ignore */ }
          }
          setLastData(prev => {
            const newData: SensorData = {
              temperature: data.telemetry.ambientTemperature,
              humidity: data.telemetry.humidity,
              light: data.telemetry.lightIntensity,
              soil_moisture: data.telemetry.soilMoisture,
              buzzer: props?.buzzer || 'OFF',
              mode: props?.buzzerMode || 'OFF',
              heater: props?.heater || 'OFF',
              timestamp: new Date(data.telemetry.timestamp).toLocaleTimeString(),
            };
            return newData;
          });
        }
      }
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    // Try to connect via WebSockets (port 9001)
    const brokerUrl = `ws://${window.location.hostname}:9001`;
    
    console.log(`[MQTT] Connecting to ${brokerUrl}...`);
    
    const mqttClient = mqtt.connect(brokerUrl, {
      reconnectPeriod: 5000,
      connectTimeout: 10 * 1000,
    });

    mqttClient.on('connect', () => {
      console.log('[MQTT] Connected to broker via WebSockets');
      setIsConnected(true);
      mqttFailed.current = false;
      mqttClient.subscribe('yolofarm/sensor/all');
      
      // Stop polling if we were polling as fallback
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    });

    mqttClient.on('message', (topic, message) => {
      if (topic === 'yolofarm/sensor/all') {
        try {
          const data = JSON.parse(message.toString());
          setLastData({
            ...data,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (e) {
          console.error('[MQTT] Failed to parse message:', e);
        }
      }
    });

    mqttClient.on('error', (err) => {
      // Only log once to avoid spam
      if (!mqttFailed.current) {
        console.warn('[MQTT] Broker unavailable, falling back to API polling. Error:', err.message);
        mqttFailed.current = true;
        
        // Start polling as fallback
        if (!pollingRef.current) {
          pollingRef.current = setInterval(pollLatestData, 5000);
          pollLatestData(); // Poll immediately
        }
      }
      setIsConnected(false);
    });

    mqttClient.on('close', () => {
      setIsConnected(false);
      
      // Start polling when disconnected
      if (!pollingRef.current) {
        pollingRef.current = setInterval(pollLatestData, 5000);
      }
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [pollLatestData]);

  const publish = useCallback((topic: string, message: any) => {
    if (client && isConnected) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      client.publish(topic, payload);
    } else {
      console.warn('[MQTT] Cannot publish, client not connected');
    }
  }, [client, isConnected]);

  return { isConnected, lastData, publish, setLastData };
}
