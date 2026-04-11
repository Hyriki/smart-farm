import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | null = null;
const subscribers = new Map<string, Set<(data: any) => void>>();

export async function initMqttClient() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://192.168.1.95:1883';
  
  client = mqtt.connect(brokerUrl);

  client.on('connect', () => {
    console.log('✓ MQTT connected');
    // Subscribe vào topic sensor
    client?.subscribe('yolofarm/sensor/all', (err) => {
      if (!err) console.log('✓ Subscribed to yolofarm/sensor/all');
    });
  });

  client.on('message', (topic, message) => {
    handleIncomingMessage(topic, message);
  });

  client.on('error', (error) => {
    console.error(' MQTT Error:', error);
  });

  return client;
}

function handleIncomingMessage(topic: string, message: Buffer) {
  try {
    const data = JSON.parse(message.toString());
    console.log(`📨 Received from ${topic}:`, data);
    
    // Trigger tất cả subscribers
    const topicSubscribers = subscribers.get(topic);
    if (topicSubscribers) {
      topicSubscribers.forEach(callback => callback(data));
    }
  } catch (error) {
    console.error('Failed to parse MQTT:', error);
  }
}

export function onMqttMessage(topic: string, callback: (data: any) => void) {
  if (!subscribers.has(topic)) {
    subscribers.set(topic, new Set());
  }
  subscribers.get(topic)?.add(callback);
}

export async function publishMqtt(topic: string, data: any) {
  if (!client?.connected) {
    console.warn('MQTT not connected');
    return;
  }
  client.publish(topic, typeof data === 'string' ? data : JSON.stringify(data), { qos: 1 });
  console.log(`📤 Published to ${topic}`);
}

export function getMqttClient() {
  return client;
}