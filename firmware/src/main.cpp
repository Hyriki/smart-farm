#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <BH1750.h>

// ===================== PIN CONFIG =====================
#define BUZZER_PIN 18
#define HEATER_PIN 23
#define SOIL_MOISTURE_PIN 36
#define DHT_TYPE DHT11
#define DHT_PIN 5

// ===================== WIFI / MQTT CONFIG =====================
#define WIFI_SSID     "ChaSing"
#define WIFI_PASSWORD "0786228108"
#define MQTT_BROKER   "192.168.1.37"
#define MQTT_PORT     1883

#define SENSOR_JSON_TOPIC     "yolofarm/sensor/all"
#define BUZZER_CONTROL_TOPIC  "yolofarm/control/buzzer"
#define HEATER_CONTROL_TOPIC  "yolofarm/control/heater"

// ===================== SENSOR OBJECTS =====================
DHT dht(DHT_PIN, DHT_TYPE);
BH1750 lightMeter;

WiFiClient espClient;
PubSubClient client(espClient);

// true = AUTO, false = OFF
bool buzzerEnabled = true;
bool currentBuzzerState = false;

// heater manual control
bool heaterState = false;

int soil_threshold_low = 10;

QueueHandle_t sensorQueue;

typedef struct {
  float humidity;
  float temperature;
  float light;
  float soilMoisturePercent;
  bool dhtValid;
  bool lightValid;
  bool buzzerState;
  bool buzzerMode;
  bool heaterState;
} SensorData;

void setup_wifi() {
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setBuzzerState(bool state) {
  currentBuzzerState = state;
  digitalWrite(BUZZER_PIN, state ? HIGH : LOW);
}

void setHeaterState(bool state) {
  heaterState = state;
  digitalWrite(HEATER_PIN, state ? HIGH : LOW);

}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim();
  message.toUpperCase();

  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  String topicStr = String(topic);

  if (topicStr == BUZZER_CONTROL_TOPIC) {
    if (message == "OFF") {
      buzzerEnabled = false;
      setBuzzerState(false);
      Serial.println("Buzzer forced OFF");
    }
    else if (message == "AUTO") {
      buzzerEnabled = true;
      Serial.println("Buzzer returned to AUTO mode");
    }
    else {
      Serial.println("Unknown buzzer command. Use AUTO or OFF");
    }
  }
  else if (topicStr == HEATER_CONTROL_TOPIC) {
    if (message == "ON") {
      setHeaterState(true);
      Serial.println("Heater ON");
    }
    else if (message == "OFF") {
      setHeaterState(false);
      Serial.println("Heater OFF");
    }
    else {
      Serial.println("Unknown heater command. Use ON or OFF");
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    if (client.connect("ESP32Client")) {
      Serial.println(" connected");
      client.subscribe(BUZZER_CONTROL_TOPIC);
      client.subscribe(HEATER_CONTROL_TOPIC);
      Serial.println("Subscribed: buzzer + heater control topics");
    } else {
      Serial.print(" failed, rc=");
      Serial.print(client.state());
      Serial.println(" -> retry in 2 seconds");
      delay(2000);
    }
  }
}

String buildSensorJson(const SensorData& data) {
  String json = "{";

  json += "\"humidity\":";
  if (data.dhtValid) json += String(data.humidity, 2);
  else json += "null";

  json += ",\"temperature\":";
  if (data.dhtValid) json += String(data.temperature, 2);
  else json += "null";

  json += ",\"light\":";
  if (data.lightValid) json += String(data.light, 2);
  else json += "null";

  json += ",\"soil_moisture\":";
  json += String(data.soilMoisturePercent, 2);

  json += ",\"buzzer\":\"";
  json += (data.buzzerState ? "ON" : "OFF");
  json += "\"";

  json += ",\"mode\":\"";
  json += (data.buzzerMode ? "AUTO" : "OFF");
  json += "\"";

  json += ",\"heater\":\"";
  json += (data.heaterState ? "ON" : "OFF");
  json += "\"";

  json += "}";

  return json;
}

void sensorTask(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(5000);

  SensorData data;

  while (1) {
    int soilMoistureValue = analogRead(SOIL_MOISTURE_PIN);
    data.soilMoisturePercent = 100.0f - ((soilMoistureValue / 4095.0f) * 100.0f);

    if (data.soilMoisturePercent < 0) data.soilMoisturePercent = 0;
    if (data.soilMoisturePercent > 100) data.soilMoisturePercent = 100;

    data.humidity = dht.readHumidity();
    data.temperature = dht.readTemperature();
    data.dhtValid = !(isnan(data.humidity) || isnan(data.temperature));

    data.light = lightMeter.readLightLevel();
    data.lightValid = (data.light >= 0);

    if (buzzerEnabled) {
      if (data.soilMoisturePercent < soil_threshold_low) {
        setBuzzerState(true);
      } else {
        setBuzzerState(false);
      }
    } else {
      setBuzzerState(false);
    }

    data.buzzerState = currentBuzzerState;
    data.buzzerMode = buzzerEnabled;
    data.heaterState = heaterState;

    Serial.println("------ Sensor Data ------");

    if (data.dhtValid) {
      Serial.print("Humidity: ");
      Serial.print(data.humidity);
      Serial.println(" %");

      Serial.print("Temperature: ");
      Serial.print(data.temperature);
      Serial.println(" *C");
    } else {
      Serial.println("Failed to read from DHT11!");
    }

    if (data.lightValid) {
      Serial.print("Light: ");
      Serial.print(data.light);
      Serial.println(" lx");
    } else {
      Serial.println("Failed to read from BH1750!");
    }

    Serial.print("Soil Moisture: ");
    Serial.print(data.soilMoisturePercent);
    Serial.println(" %");

    Serial.print("Mode: ");
    Serial.println(data.buzzerMode ? "AUTO" : "OFF");

    Serial.print("Buzzer: ");
    Serial.println(data.buzzerState ? "ON" : "OFF");

    Serial.print("Heater: ");
    Serial.println(data.heaterState ? "ON" : "OFF");

    Serial.println("-------------------------");

    xQueueOverwrite(sensorQueue, &data);
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

void mqttTask(void *pvParameters) {
  SensorData data;

  while (1) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi lost. Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

      int retry = 0;
      while (WiFi.status() != WL_CONNECTED && retry < 20) {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
        retry++;
      }
      Serial.println();
    }

    if (!client.connected()) {
      reconnect();
    }

    client.loop();

    if (xQueueReceive(sensorQueue, &data, pdMS_TO_TICKS(100)) == pdPASS) {
      if (client.connected()) {
        String jsonPayload = buildSensorJson(data);
        client.publish(SENSOR_JSON_TOPIC, jsonPayload.c_str(), true);

        Serial.print("Published JSON: ");
        Serial.println(jsonPayload);
      }
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("System booting...");

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  pinMode(HEATER_PIN, OUTPUT);
  digitalWrite(HEATER_PIN, LOW);

  setup_wifi();

  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(callback);

  dht.begin();
  Serial.println("DHT11 initialized");

  Wire.begin(21, 22);

  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 initialized successfully");
  } else {
    Serial.println("Error initializing BH1750");
  }

  sensorQueue = xQueueCreate(1, sizeof(SensorData));
  if (sensorQueue == NULL) {
    Serial.println("Failed to create queue!");
    while (1) {
      delay(1000);
    }
  }

  xTaskCreatePinnedToCore(sensorTask, "Sensor Task", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(mqttTask, "MQTT Task", 6144, NULL, 1, NULL, 0);

  Serial.println("FreeRTOS tasks created");
}

void loop() {
}