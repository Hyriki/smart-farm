import sys
import time
import json
import threading
import paho.mqtt.client as mqtt
from Adafruit_IO import MQTTClient
import ssl
import os
from dotenv import load_dotenv

ssl._create_default_https_context = ssl._create_unverified_context
import urllib3
urllib3.disable_warnings()

load_dotenv('../.env')
AIO_USERNAME = os.getenv("AIO_USERNAME")
AIO_KEY = os.getenv("AIO_KEY")

JSON_SENSOR_TOPIC = "yolofarm/sensor/all"

TOPIC_TO_FEED = {
}

FEED_TO_TOPIC = {
    "buzzer-state": "yolofarm/control/buzzer",
    "heater": "yolofarm/control/heater",
}

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT"))

local_mqtt_client = None
local_mqtt_connected = False
mqtt_lock = threading.Lock()

SENSOR_FEEDS = {"temperature", "humidity", "light-intensity", "soil-moisture"}
STATE_FEEDS = {"heater"}

MIN_SENSOR_INTERVAL = 15

last_publish_time = {}
last_feed_value = {}


def aio_connected(client):
    print("[AIO] Connected to Adafruit IO")
    for feed in FEED_TO_TOPIC.keys():
        client.subscribe(feed)
        print(f"[AIO] Subscribed to control feed: {feed}")


def aio_disconnected(client):
    print("[AIO] Disconnected from Adafruit IO")
    while True:
        try:
            print("[AIO] Reconnecting...")
            client.connect()
            print("[AIO] Reconnected successfully")
            break
        except Exception as e:
            print(f"[AIO] Reconnect failed: {e}")
            time.sleep(5)


def aio_message(client, feed_id, payload):
    payload = str(payload).strip().upper()
    print(f"[AIO] Received control '{payload}' from feed '{feed_id}'")

    if feed_id in FEED_TO_TOPIC:
        topic = FEED_TO_TOPIC[feed_id]

        global local_mqtt_connected
        if local_mqtt_client is not None and local_mqtt_connected:
            try:
                with mqtt_lock:
                    local_mqtt_client.publish(topic, payload, retain=True)
                print(f"[MQTT] Published '{payload}' to topic '{topic}'")
            except Exception as e:
                print(f"[MQTT] Failed to publish control to local broker: {e}")
        else:
            print("[MQTT] Local broker not connected, cannot forward control command")
    else:
        print(f"[WARN] No local MQTT topic mapping for feed: {feed_id}")


def on_connect(client, userdata, flags, rc):
    global local_mqtt_connected

    if rc == 0:
        local_mqtt_connected = True
        print("[MQTT] Connected to local broker successfully")

        client.subscribe(JSON_SENSOR_TOPIC)
        print(f"[MQTT] Subscribed to JSON sensor topic: {JSON_SENSOR_TOPIC}")

        for topic in TOPIC_TO_FEED.keys():
            client.subscribe(topic)
            print(f"[MQTT] Subscribed to status topic: {topic}")
    else:
        local_mqtt_connected = False
        print(f"[MQTT] Failed to connect, rc={rc}")


def on_disconnect(client, userdata, rc):
    global local_mqtt_connected
    local_mqtt_connected = False

    print(f"[MQTT] Disconnected from local broker, rc={rc}")
    while True:
        try:
            print("[MQTT] Reconnecting to local broker...")
            client.reconnect()
            print("[MQTT] Reconnected successfully")
            break
        except Exception as e:
            print(f"[MQTT] Reconnect failed: {e}")
            time.sleep(5)


def should_publish(feed_name, new_value):
    now = time.time()
    old_value = last_feed_value.get(feed_name)
    last_time = last_publish_time.get(feed_name)

    if last_time is None:
        return True

    if feed_name in STATE_FEEDS:
        return old_value != new_value

    if feed_name in SENSOR_FEEDS:
        return (now - last_time) >= MIN_SENSOR_INTERVAL

    return True


def publish_to_aio(feed_name, value):
    try:
        aio.publish(feed_name, value)
        last_publish_time[feed_name] = time.time()
        last_feed_value[feed_name] = value
        print(f"[AIO] Published '{value}' to feed '{feed_name}'")
    except Exception as e:
        print(f"[AIO] Publish failed for feed '{feed_name}': {e}")


def handle_sensor_json(payload):
    try:
        data = json.loads(payload)
        print(f"[JSON] Parsed: {data}")

        mapping = {
            "temperature": "temperature",
            "humidity": "humidity",
            "light": "light-intensity",
            "soil_moisture": "soil-moisture",
            "heater": "heater",
        }

        for json_key, feed_name in mapping.items():
            if json_key not in data:
                continue

            value = data[json_key]
            if value is None:
                continue

            if should_publish(feed_name, value):
                publish_to_aio(feed_name, value)
            else:
                print(f"[SKIP] Feed '{feed_name}' skipped")

    except json.JSONDecodeError as e:
        print(f"[JSON] Decode error: {e}")
    except Exception as e:
        print(f"[JSON] Unexpected error: {e}")


def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode(errors="ignore").strip()

    print(f"[MQTT] Received '{payload}' from topic '{topic}'")

    if topic == JSON_SENSOR_TOPIC:
        handle_sensor_json(payload)
    elif topic in TOPIC_TO_FEED:
        feed_name = TOPIC_TO_FEED[topic]
        if should_publish(feed_name, payload):
            publish_to_aio(feed_name, payload)
        else:
            print(f"[SKIP] Feed '{feed_name}' skipped")
    else:
        print(f"[WARN] No Adafruit feed mapping for topic: {topic}")


aio = MQTTClient(AIO_USERNAME, AIO_KEY)
aio.on_connect = aio_connected
aio.on_disconnect = aio_disconnected
aio.on_message = aio_message


def main():
    global local_mqtt_client

    try:
        print("[AIO] Connecting...")
        aio.connect()
        aio.loop_background()

        print("[MQTT] Connecting to local broker...")
        local_mqtt_client = mqtt.Client()
        local_mqtt_client.on_connect = on_connect
        local_mqtt_client.on_disconnect = on_disconnect
        local_mqtt_client.on_message = on_message

        local_mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        local_mqtt_client.loop_forever()

    except KeyboardInterrupt:
        print("\n[INFO] Gateway stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()