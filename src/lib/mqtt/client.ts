import mqtt, { MqttClient } from 'mqtt';

// Next.js App Router may load this module in separate module graph contexts
// (Server Component rendering vs. Route Handler execution). Using globalThis
// ensures the MQTT client instance is shared within the same Node.js process.
declare global {
  var _mqttClientInstance: MqttClient | null | undefined;
}

const subscribers = new Map<string, Set<(data: unknown) => void>>();
let mockModeInterval: NodeJS.Timeout | null = null;

function generateFakeSensorData() {
  return {
    humidity: Math.random() * 40 + 40,      // 40–80 %
    temperature: Math.random() * 15 + 20,   // 20–35 °C
    light: Math.random() * 500 + 200,       // 200–700 lux
    soil_moisture: Math.random() * 80 + 10, // 10–90 % — wide range so threshold triggers ~50 % of the time
    buzzer: 'OFF' as const,   // backend threshold logic owns buzzer state
    mode: 'OFF' as const,     // backend DB owns buzzer mode
    heater: Math.random() > 0.5 ? ('ON' as const) : ('OFF' as const),
  };
}

export async function initMqttClient() {
  const mockMode = process.env.MQTT_MOCK_MODE === 'true';

  if (mockMode) {
    console.log('🎭 MQTT Mock Mode enabled');
    setTimeout(() => {
      console.log('✓ MQTT connected (mock)');
      console.log('✓ Subscribed to yolofarm/sensor/all (mock)');
    }, 500);

    mockModeInterval = setInterval(() => {
      const fakeData = generateFakeSensorData();
      handleIncomingMessage('yolofarm/sensor/all', Buffer.from(JSON.stringify(fakeData)));
    }, 5000);

    return null;
  }

  // Reuse an already-connected client (survives hot-reload and multiple init calls)
  if (globalThis._mqttClientInstance?.connected) {
    console.log('[MQTT] Reusing existing connected client');
    return globalThis._mqttClientInstance;
  }

  const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
  const client = mqtt.connect(brokerUrl);
  globalThis._mqttClientInstance = client;

  client.on('connect', () => {
    console.log('✓ MQTT connected');
    client.subscribe('yolofarm/sensor/all', (err) => {
      if (!err) console.log('✓ Subscribed to yolofarm/sensor/all');
    });
  });

  client.on('message', (topic, message) => {
    handleIncomingMessage(topic, message);
  });

  client.on('error', (error) => {
    console.error('MQTT Error:', error);
  });

  return client;
}

function handleIncomingMessage(topic: string, message: Buffer) {
  try {
    const data = JSON.parse(message.toString());
    console.log(`📨 Received from ${topic}:`, data);

    const topicSubscribers = subscribers.get(topic);
    if (topicSubscribers) {
      topicSubscribers.forEach((callback) => callback(data));
    }
  } catch (error) {
    console.error('Failed to parse MQTT message:', error);
  }
}

export function onMqttMessage(topic: string, callback: (data: unknown) => void) {
  if (!subscribers.has(topic)) {
    subscribers.set(topic, new Set());
  }
  subscribers.get(topic)?.add(callback);
}

/**
 * Publish a message to an MQTT topic.
 * Returns true if the message was delivered (or simulated in mock mode).
 * Returns false if MQTT is not connected.
 */
export async function publishMqtt(topic: string, data: unknown): Promise<boolean> {
  // In mock mode there is no real broker, but we still want callers (e.g. toggle
  // route) to get a "success" result so they can report mqttPublished: true.
  if (process.env.MQTT_MOCK_MODE === 'true') {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    console.log(`📤 [MOCK] Published to ${topic}: ${payload}`);
    return true;
  }

  const client = globalThis._mqttClientInstance;
  if (!client?.connected) {
    console.warn(`MQTT not connected — skipped publish to ${topic}`);
    return false;
  }

  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  client.publish(topic, payload, { qos: 1 });
  console.log(`📤 Published to ${topic}: ${payload}`);
  return true;
}

export function getMqttClient(): MqttClient | null {
  return globalThis._mqttClientInstance ?? null;
}
