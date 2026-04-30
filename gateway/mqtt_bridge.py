"""
Smart-farm MQTT bridge.

Connects to the local MQTT broker, subscribes to sensor data and control
topics, and logs all traffic. Run this on any machine that has network
access to the broker (e.g. the same host as the Next.js server, or a
Raspberry Pi on the local network).

Environment variables (set in gateway/.env or passed directly):
    MQTT_BROKER   — broker hostname or IP  (default: localhost)
    MQTT_PORT     — broker port            (default: 1883)
    MQTT_USERNAME — broker username        (optional)
    MQTT_PASSWORD — broker password        (optional)
"""

import json
import os
import sys

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")

SENSOR_TOPIC = "yolofarm/sensor/all"
BUZZER_CONTROL_TOPIC = "yolofarm/control/buzzer"
HEATER_CONTROL_TOPIC = "yolofarm/control/heater"

SUBSCRIBE_TOPICS = [SENSOR_TOPIC, BUZZER_CONTROL_TOPIC, HEATER_CONTROL_TOPIC]


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Connected to {MQTT_BROKER}:{MQTT_PORT}")
        for topic in SUBSCRIBE_TOPICS:
            client.subscribe(topic)
            print(f"[MQTT] Subscribed to {topic}")
    else:
        print(f"[MQTT] Connection failed, rc={rc}")


def on_disconnect(client, userdata, rc):
    print(f"[MQTT] Disconnected, rc={rc}")


def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode(errors="ignore").strip()

    if topic == SENSOR_TOPIC:
        try:
            data = json.loads(payload)
            print(f"[SENSOR] {data}")
        except json.JSONDecodeError:
            print(f"[SENSOR] Invalid JSON: {payload}")
    else:
        print(f"[CONTROL] {topic}: {payload}")


def main():
    client = mqtt.Client()

    if MQTT_USERNAME:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    try:
        print(f"[MQTT] Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        client.loop_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Gateway stopped")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
