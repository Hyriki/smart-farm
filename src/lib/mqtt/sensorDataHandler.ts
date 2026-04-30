// src/lib/mqtt/sensorDataHandler.ts
import { createTelemetryController } from '@/db/controllers/sensorController';
import { publishMqtt } from './client';

const SOIL_MOISTURE_THRESHOLD = 50;

// Sensor threshold → notification config
const NOTIFICATION_THRESHOLDS = [
  {
    sensorKey: 'soil_moisture',
    sensorName: 'Soil Moisture',
    unit: '%',
    threshold: 30,
    direction: 'below' as const,
    getValue: (p: SensorPayload) => p.soil_moisture,
    message: (v: number) =>
      `Soil moisture is too low (${v.toFixed(1)}%). Please check irrigation.`,
  },
  {
    sensorKey: 'temperature',
    sensorName: 'Temperature',
    unit: '°C',
    threshold: 35,
    direction: 'above' as const,
    getValue: (p: SensorPayload) => p.temperature,
    message: (v: number) =>
      `Temperature is too high (${v.toFixed(1)}°C). Cooling may be needed.`,
  },
  {
    sensorKey: 'humidity',
    sensorName: 'Humidity',
    unit: '%',
    threshold: 40,
    direction: 'below' as const,
    getValue: (p: SensorPayload) => p.humidity,
    message: (v: number) => `Humidity is too low (${v.toFixed(1)}%).`,
  },
  {
    sensorKey: 'light_intensity',
    sensorName: 'Light Intensity',
    unit: ' lux',
    threshold: 300,
    direction: 'below' as const,
    getValue: (p: SensorPayload) => p.light,
    message: (v: number) => `Light intensity is too low (${v.toFixed(0)} lux).`,
  },
] as const;

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

// In-process cache for buzzer hardware state — avoids a DB read on every MQTT poll.
// Synced to Actuator.currentState on every change.
declare global {
  var _buzzerHardwareState: 'ON' | 'OFF' | undefined;
}
globalThis._buzzerHardwareState ??= 'OFF';

export function getBuzzerHardwareState(): 'ON' | 'OFF' {
  return globalThis._buzzerHardwareState ?? 'OFF';
}

export async function forceBuzzerStateOff(): Promise<void> {
  globalThis._buzzerHardwareState = 'OFF';
  const { prisma } = await import('@/lib/prisma');
  await prisma.actuator.updateMany({
    where: { role: 'buzzer' },
    data: { currentState: 'OFF' },
  });
  console.log('[BUZZER] hardware state forced to OFF (cache + DB)');
}

// ─── Notification helpers ─────────────────────────────────────────────────────

async function syncNotifications(payload: SensorPayload) {
  const { prisma } = await import('@/lib/prisma');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pc = prisma as any;

  if (!pc.notification) {
    console.warn('[SensorHandler] Notification table not yet migrated — run: npx prisma migrate dev');
    return;
  }

  for (const cfg of NOTIFICATION_THRESHOLDS) {
    const raw = cfg.getValue(payload);
    if (raw === null || raw === undefined) continue;

    const violated =
      cfg.direction === 'below' ? raw < cfg.threshold : raw > cfg.threshold;

    try {
      if (violated) {
        await pc.notification.upsert({
          where: { sensorKey: cfg.sensorKey },
          create: {
            sensorKey: cfg.sensorKey,
            type: 'warning',
            message: cfg.message(raw),
            sensorName: cfg.sensorName,
            currentValue: raw,
            threshold: cfg.threshold,
            unit: cfg.unit,
            isResolved: false,
          },
          update: {
            currentValue: raw,
            message: cfg.message(raw),
            isResolved: false,
          },
        });
      } else {
        await pc.notification.updateMany({
          where: { sensorKey: cfg.sensorKey, isResolved: false },
          data: { isResolved: true },
        });
      }
    } catch (err) {
      console.error(`[SensorHandler] notification sync failed for ${cfg.sensorKey}:`, err);
    }
  }
}

// ─── Core sensor processing ───────────────────────────────────────────────────

export async function processSensorData(
  payload: SensorPayload,
  sensorId: number = DEFAULT_SENSOR_ID,
) {
  try {
    console.log(`[SensorHandler] Processing data for sensor ${sensorId}:`, payload);

    const { prisma } = await import('@/lib/prisma');

    // Read both actuators. Use raw SQL for buzzer so the `mode` column is
    // accessible even when the generated Prisma client is stale (pre-migration).
    let buzzerActuator: { id: number; mode: string | null; currentState: string } | null = null;
    try {
      const rows = await prisma.$queryRaw<Array<{ id: number; mode: string | null; currentState: string }>>`
        SELECT "id", "mode", "currentState" FROM "Actuator" WHERE "role" = 'buzzer' LIMIT 1
      `;
      buzzerActuator = rows[0] ?? null;
    } catch {
      const b = await prisma.actuator.findFirst({
        where: { role: 'buzzer' },
        select: { id: true, currentState: true },
      });
      buzzerActuator = b ? { ...b, mode: null } : null;
    }

    const heaterActuator = await prisma.actuator.findFirst({
      where: { role: 'heater' },
      select: { currentState: true },
    });

    // mode column is the authority for buzzer (AUTO/OFF).
    const buzzerMode: 'AUTO' | 'OFF' =
      buzzerActuator?.mode === 'AUTO' ? 'AUTO' : 'OFF';

    // currentState for buzzer is the hardware state (ON/OFF) — persisted.
    const dbHardwareState =
      (buzzerActuator?.currentState ?? 'OFF') as 'ON' | 'OFF';

    // Keep in-process cache in sync with DB value read.
    globalThis._buzzerHardwareState = dbHardwareState;

    // Heater state comes from DB, not from the mock/ESP32 payload (which may be random).
    const heaterState: 'ON' | 'OFF' =
      heaterActuator?.currentState === 'ON' ? 'ON' : 'OFF';

    console.log(`[BUZZER] DB mode: ${buzzerMode}, DB hwState: ${dbHardwareState}`);

    if (buzzerMode === 'AUTO') {
      const shouldActivate = payload.soil_moisture < SOIL_MOISTURE_THRESHOLD;
      const newState: 'ON' | 'OFF' = shouldActivate ? 'ON' : 'OFF';

      if (newState !== dbHardwareState && buzzerActuator) {
        globalThis._buzzerHardwareState = newState;
        await prisma.actuator.update({
          where: { id: buzzerActuator.id },
          data: { currentState: newState },
        });
        console.log(`[BUZZER] AUTO → state changed ${dbHardwareState} → ${newState}`);
        await publishMqtt('yolofarm/control/buzzer', newState);
      }
    } else {
      // mode=OFF → ensure hardware is off.
      if (dbHardwareState !== 'OFF' && buzzerActuator) {
        globalThis._buzzerHardwareState = 'OFF';
        await prisma.actuator.update({
          where: { id: buzzerActuator.id },
          data: { currentState: 'OFF' },
        });
        await publishMqtt('yolofarm/control/buzzer', 'OFF');
      }
    }

    const buzzerState = globalThis._buzzerHardwareState ?? 'OFF';

    // Save telemetry (sensor measurements only — no actuator state in properties).
    const telemetry = await createTelemetryController(sensorId, {
      humidity: payload.humidity,
      ambientTemperature: payload.temperature,
      lightIntensity: payload.light,
      soilMoisture: payload.soil_moisture,
    });

    console.log(`[SensorHandler] ✓ Telemetry saved (id=${telemetry.id})`);

    // Sync threshold notifications to DB.
    await syncNotifications(payload);

    // Broadcast to dashboard (via MQTT processed topic).
    await publishMqtt(`yolofarm/sensor/${sensorId}/processed`, {
      humidity: payload.humidity,
      temperature: payload.temperature,
      light: payload.light,
      soil_moisture: payload.soil_moisture,
      heater: heaterState,
      buzzerMode,
      buzzerState,
      telemetryId: telemetry.id,
      timestamp: new Date().toISOString(),
      status: 'saved',
    });

    console.log(`[SensorHandler] ✓ Broadcast completed`);
    return telemetry;
  } catch (error) {
    console.error(`[SensorHandler] ✗ Error:`, error);
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
