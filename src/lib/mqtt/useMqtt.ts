"use client";

import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    // In browser, connect via WebSockets (port 9001)
    // We use the hostname of the current window to connect to the broker
    const brokerUrl = `ws://${window.location.hostname}:9001`;
    
    console.log(`[MQTT] Connecting to ${brokerUrl}...`);
    
    const mqttClient = mqtt.connect(brokerUrl, {
      reconnectPeriod: 5000,
      connectTimeout: 30 * 1000,
    });

    mqttClient.on('connect', () => {
      console.log('[MQTT] Connected to broker via WebSockets');
      setIsConnected(true);
      mqttClient.subscribe('yolofarm/sensor/all');
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
      console.error('[MQTT] Connection error:', err);
      setIsConnected(false);
    });

    mqttClient.on('close', () => {
      setIsConnected(false);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  const publish = useCallback((topic: string, message: any) => {
    if (client && isConnected) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      client.publish(topic, payload);
    } else {
      console.warn('[MQTT] Cannot publish, client not connected');
    }
  }, [client, isConnected]);

  return { isConnected, lastData, publish };
}
