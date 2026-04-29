import { initMqttClient } from './client';
import { subscribeToSensorData } from './sensorDataHandler';

declare global {
  var _mqttInitialized: boolean | undefined;
}

export async function initializeMqtt() {
  if (globalThis._mqttInitialized) return;

  if (typeof window === 'undefined') {
    try {
      console.log('[MQTT] Initializing...');
      await initMqttClient();
      subscribeToSensorData();
      globalThis._mqttInitialized = true;
      console.log('[MQTT] ✓ Initialized successfully');
    } catch (error) {
      console.error('[MQTT] ✗ Failed to initialize:', error);
    }
  }
}
