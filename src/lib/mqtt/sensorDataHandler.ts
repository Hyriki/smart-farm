// src/lib/mqtt/sensorDataHandler.ts
import { createTelemetryController } from '@/db/controllers/sensorController';
import { publishMqtt } from './client';

const SOIL_MOISTURE_THRESHOLD = 50;

interface SensorPayload {
  humidity: number | null;
  temperature: number | null;
  light: number | null;
  soil_moisture: number;
  buzzer: 'ON' | 'OFF';
  mode: 'AUTO' | 'OFF';
  heater: 'ON' | 'OFF';
}

const DEFAULT_SENSOR_ID = 1;

// Use globalThis so hardware state is shared across Next.js module graph contexts.
declare global {
  var _buzzerHardwareState: 'ON' | 'OFF' | undefined;
}
globalThis._buzzerHardwareState ??= 'OFF';

export function getBuzzerHardwareState(): 'ON' | 'OFF' {
  return globalThis._buzzerHardwareState ?? 'OFF';
}

export function forceBuzzerStateOff() {
  globalThis._buzzerHardwareState = 'OFF';
  console.log('[BUZZER] hardware state forced to OFF');
}

export async function processSensorData(
  payload: SensorPayload,
  sensorId: number = DEFAULT_SENSOR_ID,
) {
  try {
    console.log(`[SensorHandler] Processing data for sensor ${sensorId}:`, payload);

    // Read buzzerMode from DB every call — avoids stale in-memory state across module contexts.
    const { prisma } = await import('@/lib/prisma');
    const buzzerActuator = await prisma.actuator.findFirst({
      where: { role: 'buzzer' },
      select: { currentState: true },
    });
    const buzzerMode: 'AUTO' | 'OFF' =
      buzzerActuator?.currentState === 'AUTO' ? 'AUTO' : 'OFF';

    console.log(`[BUZZER] DB mode: ${buzzerMode}`);

    if (buzzerMode === 'AUTO') {
      console.log('[BUZZER] AUTO → threshold controls state');
      const shouldActivate = payload.soil_moisture < SOIL_MOISTURE_THRESHOLD;
      const newState: 'ON' | 'OFF' = shouldActivate ? 'ON' : 'OFF';

      if (newState !== globalThis._buzzerHardwareState) {
        globalThis._buzzerHardwareState = newState;
        console.log(`[BUZZER] state updated to ${newState}`);
        await publishMqtt('yolofarm/control/buzzer', newState);
      }
    } else {
      console.log('[BUZZER] mode OFF → forcing OFF');
      if (globalThis._buzzerHardwareState !== 'OFF') {
        globalThis._buzzerHardwareState = 'OFF';
        await publishMqtt('yolofarm/control/buzzer', 'OFF');
      }
    }

    const buzzerState = globalThis._buzzerHardwareState ?? 'OFF';

    const telemetry = await createTelemetryController(sensorId, {
      humidity: payload.humidity,
      ambientTemperature: payload.temperature,
      lightIntensity: payload.light,
      soilMoisture: payload.soil_moisture,
      properties: {
        buzzerMode,
        buzzerState,
        heater: payload.heater,
      },
    });

    console.log(`[SensorHandler] ✓ Telemetry saved for sensor ${sensorId}:`, telemetry);

    await publishMqtt(`yolofarm/sensor/${sensorId}/processed`, {
      humidity: payload.humidity,
      temperature: payload.temperature,
      light: payload.light,
      soil_moisture: payload.soil_moisture,
      heater: payload.heater,
      buzzerMode,
      buzzerState,
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

export async function subscribeToSensorData() {
  const { onMqttMessage } = await import('./client');

  onMqttMessage('yolofarm/sensor/all', async (data: unknown) => {
    try {
      await processSensorData(data as SensorPayload, DEFAULT_SENSOR_ID);
    } catch (error) {
      console.error('[SensorHandler] Error handling MQTT message:', error);
    }
  });

  console.log('[SensorHandler] Subscribed to sensor data');
}
