import { initMqttClient } from './client';
import { subscribeToSensorData } from './sensorDataHandler';

let initialized = false;

export async function initializeMqtt() {
  if (initialized) return;

  if (typeof window === 'undefined') { // Server-side only
    try {
      console.log('[MQTT] Initializing...');
      await initMqttClient();
      subscribeToSensorData();
      initialized = true;
      console.log('[MQTT] ✓ Initialized successfully');
    } catch (error) {
      console.error('[MQTT] ✗ Failed to initialize:', error);
    }
  }
}