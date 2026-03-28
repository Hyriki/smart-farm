# Yolo Farm

A modern full-stack web application built with [Next.js](https://nextjs.org), [Prisma ORM](https://www.prisma.io), and [PostgreSQL](https://www.postgresql.org).

## Overview

This project is a production-ready application featuring:

- **Next.js 16** – Modern React framework with server-side rendering and API routes
- **Prisma ORM** – Type-safe database access and migrations
- **PostgreSQL Database** – Hosted on [Supabase](https://supabase.com)
- **Docker & Docker Compose** – Containerized deployment for consistency across environments
- **TypeScript** – End-to-end type safety

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
- [Node.js](https://nodejs.org) 20+ (for local development)

## Getting Started

### Running the Complete MQTT System

This project integrates IoT sensors via MQTT. Here's how to set up and run the entire system:

#### Prerequisites for MQTT

- ESP32 with code uploaded (see `firmware/esp32_sensor.ino`)
- MQTT Broker running (Mosquitto)
- Python 3.11+ with pip

#### Step 1: Start MQTT Broker

**Using Docker:**
```bash
docker run -d -p 1883:1883 --name mosquitto eclipse-mosquitto
```

**Or with Homebrew (macOS):**
```bash
brew install mosquitto
mosquitto -d -p 1883
```

#### Step 2: Upload Code to ESP32

1. Open Arduino IDE
2. Load `firmware/esp32_sensor.ino`
3. **Configure credentials in code:**
   - `WIFI_SSID` → Your WiFi network name
   - `WIFI_PASSWORD` → Your WiFi password
   - `MQTT_BROKER` → Your MQTT broker IP (e.g., local network IP)
4. Install libraries: PubSubClient, DHT sensor library, BH1750
5. Select **Board** → ESP32 Dev Module
6. Select **Port** → Your ESP32's COM port
7. Click **Upload**
8. Verify in Serial Monitor that ESP32 connects to WiFi & MQTT

#### Step 3: Run Python Gateway (Optional)

For remote monitoring via Adafruit IO:

```bash
cd gateway/
pip3 install paho-mqtt adafruit-io python-dotenv
```

Create `gateway/.env`:
```env
AIO_USERNAME=[your-adafruit-username]
AIO_KEY=[your-adafruit-api-key]
MQTT_BROKER=[your-mqtt-broker-ip]
MQTT_PORT=1883
```

**Update `gateway/mqtt_bridge.py`** to read from `.env`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

AIO_USERNAME = os.getenv('AIO_USERNAME')
AIO_KEY = os.getenv('AIO_KEY')
MQTT_BROKER = os.getenv('MQTT_BROKER', '192.168.1.95')
MQTT_PORT = int(os.getenv('MQTT_PORT', '1883'))
```

Then run:
```bash
python3 mqtt_bridge.py
```

#### Step 4: Run Backend Server

```bash
npm install mqtt
npm run dev
```

Check logs for:
```
✓ MQTT connected
✓ Subscribed to yolofarm/sensor/all
```

#### Step 5: Test the System

**Test Buzzer Control:**
```bash
curl -X POST http://localhost:3000/api/control/buzzer \
  -H "Content-Type: application/json" \
  -d '{"command": "AUTO"}'
```

**Test Heater Control:**
```bash
curl -X POST http://localhost:3000/api/control/heater \
  -H "Content-Type: application/json" \
  -d '{"command": "ON"}'
```

**View Sensor Data in Database:**
```bash
npx prisma studio
```

#### System Architecture

```
ESP32 Sensor
    ↓ MQTT Publish (yolofarm/sensor/all)
MQTT Broker (MQTT_BROKER_IP:MQTT_PORT)
    ├─→ Backend Node.js (Save to DB)
    ├─→ Python Gateway (Bridge to Adafruit IO)
    └─→ Dashboard UI (Real-time display)
```

#### Environment Variables

**Backend (.env.local):**
```env
# MQTT Configuration
MQTT_BROKER_URL=mqtt://[your-mqtt-broker-ip]:1883

# Database Configuration
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
```

**Gateway (gateway/.env):**
```env
# Adafruit IO Configuration
AIO_USERNAME=[your-adafruit-username]
AIO_KEY=[your-adafruit-api-key]

# MQTT Broker Configuration
MQTT_BROKER=[your-mqtt-broker-ip]
MQTT_PORT=1883
```

#### Troubleshooting MQTT

| Issue | Solution |
|-------|----------|
| Port 1883 already in use | `docker stop mosquitto` or use different port |
| ESP32 won't connect to WiFi | Check SSID/password in `firmware/esp32_sensor.ino` |
| MQTT broker not found | Verify MQTT_BROKER_URL is correct in `.env.local` |
| Python SSL error | Run: `python3 -m pip install --upgrade certifi` |

### Using Docker (Recommended)

The easiest way to run the complete MQTT system with all services is using Docker Compose:

#### Start All Services

```bash
docker-compose up --build
```

This will start:
1. **MQTT Broker** (Mosquitto) on port 1883
2. **Python Gateway** (connects to Adafruit IO)
3. **Next.js Backend** on [http://localhost:3000](http://localhost:3000)

#### Verify Services

```bash
# Check all containers
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app        # Backend
docker-compose logs -f mqtt       # MQTT Broker
docker-compose logs -f gateway    # Python Gateway
```

#### Stop Services

```bash
docker-compose down
```

### Local Development

For development without Docker:

```bash
npm install
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000) and hot-reload as you make changes.

## Project Structure

```
firmware/
├── esp32_sensor.ino          # ESP32 sensor code (Arduino)
gateway/
├── mqtt_bridge.py            # Python gateway for Adafruit IO
src/
├── app/                      # Next.js pages and layouts
├── lib/
│   └── mqtt/                 # MQTT integration
│       ├── client.ts         # MQTT connection client
│       ├── init.ts           # MQTT initialization
│       └── sensorDataHandler.ts  # Sensor data processing
├── db/                       # Database repositories
└── generated/                # Auto-generated Prisma client
prisma/
├── schema.prisma             # Database schema
└── migrations/               # Database migrations
```

## Key Commands

```bash
# Development
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint

# Database
npx prisma studio  # Open Prisma Studio UI
npx prisma migrate dev --name migration_name  # Create migration
npx prisma migrate deploy  # Deploy migrations

# Docker (Complete System)
docker-compose up --build      # Build & start all services (MQTT, Gateway, Backend)
docker-compose up              # Start with cached images
docker-compose down            # Stop and remove containers
docker-compose ps              # Show running containers
docker-compose logs -f         # View all logs
docker-compose logs -f app     # View backend logs
docker-compose logs -f mqtt    # View MQTT broker logs
docker-compose logs -f gateway # View Python gateway logs

# MQTT Testing
mosquitto_sub -h localhost -p 1883 -t "yolofarm/#"  # Subscribe to all topics
mosquitto_pub -h localhost -p 1883 -t "test" -m "hello"  # Publish test message
```

## Database

This project uses PostgreSQL hosted on [Supabase](https://supabase.com). Database operations are managed with [Prisma ORM](https://www.prisma.io).

To update the schema:

1. Modify `prisma/schema.prisma`
2. Create and apply migrations:
   ```bash
   npx prisma migrate dev --create-only
   npx prisma migrate deploy
   ```

## Deployment

Docker is configured for production deployment. Build and push the image to your container registry:

```bash
docker build -t your-registry/yolo-farm:latest .
docker push your-registry/yolo-farm:latest
```

For deployment on Docker containers or Kubernetes, ensure the following environment variables are set:

- `DATABASE_URL` – PostgreSQL connection string
- `NODE_ENV=production`

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com)
