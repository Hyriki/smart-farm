import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | null = null;
const subscribers = new Map<string, Set<(data: any) => void>>();
let mockModeInterval: NodeJS.Timeout | null = null;

function generateFakeSensorData() {
  return {
    humidity: Math.random() * 40 + 40, // 40-80%
    temperature: Math.random() * 15 + 20, // 20-35°C
    light: Math.random() * 500 + 200, // 200-700 lux
    soil_moisture: Math.random() * 60 + 30, // 30-90%
    buzzer: Math.random() > 0.5 ? 'ON' : 'OFF',
    mode: Math.random() > 0.5 ? 'AUTO' : 'OFF',
    heater: Math.random() > 0.5 ? 'ON' : 'OFF',
  };
}

export async function initMqttClient() {
  const mockMode = process.env.MQTT_MOCK_MODE === 'true';
  
  if (mockMode) {
    console.log('🎭 MQTT Mock Mode enabled');
    
    // Simulate connection
    setTimeout(() => {
      console.log('✓ MQTT connected (mock)');
      console.log('✓ Subscribed to yolofarm/sensor/all (mock)');
    }, 500);
    
    // Generate fake data every 5 seconds
    mockModeInterval = setInterval(() => {
      const fakeData = generateFakeSensorData();
      handleIncomingMessage('yolofarm/sensor/all', Buffer.from(JSON.stringify(fakeData)));
    }, 5000);
    
    return null;
  }

  const brokerUrl = process.env.MQTT_BROKER_URL;
  
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