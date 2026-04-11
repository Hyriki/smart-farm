// src/lib/mqtt/sensorDataHandler.ts
import { createTelemetryController } from '@/db/controllers/sensorController';
import { publishMqtt } from './client';

// Payload từ ESP32
interface SensorPayload {
  humidity: number | null;
  temperature: number | null;
  light: number | null;
  soil_moisture: number;
  buzzer: 'ON' | 'OFF';
  mode: 'AUTO' | 'OFF';
  heater: 'ON' | 'OFF';
}

// ID của sensor (giả sử chỉ có 1 sensor)
const DEFAULT_SENSOR_ID = 1;

export async function processSensorData(payload: SensorPayload, sensorId: number = DEFAULT_SENSOR_ID) {
  try {
    console.log(`[SensorHandler] Processing data for sensor ${sensorId}:`, payload);

    const telemetry = await createTelemetryController(sensorId, {
      humidity: payload.humidity,
      ambientTemperature: payload.temperature,
      lightIntensity: payload.light,
      soilMoisture: payload.soil_moisture,
      properties: {
        buzzer: payload.buzzer,
        buzzerMode: payload.mode,
        heater: payload.heater,
      },
    });

    console.log(`[SensorHandler] ✓ Telemetry saved for sensor ${sensorId}:`, telemetry);

    // Broadcast tới UI/Dashboard qua MQTT
    await publishMqtt(`yolofarm/sensor/${sensorId}/processed`, {
      ...payload,
      telemetryId: telemetry.id,
      timestamp: new Date().toISOString(),
      status: 'saved',
    });

    console.log(`[SensorHandler] ✓ Broadcast to dashboard completed`);

    return telemetry;
  } catch (error) {
    console.error(`[SensorHandler] ✗ Error processing sensor data:`, error);
    throw error;
  }
}

// Subscribe to incoming sensor data khi app start
export async function subscribeToSensorData() {
  const { onMqttMessage } = await import('./client');

  onMqttMessage('yolofarm/sensor/all', async (payload: SensorPayload) => {
    try {
      await processSensorData(payload, DEFAULT_SENSOR_ID);
    } catch (error) {
      console.error('[SensorHandler] Error handling MQTT message:', error);
    }
  });

  console.log('[SensorHandler] Subscribed to sensor data');
}