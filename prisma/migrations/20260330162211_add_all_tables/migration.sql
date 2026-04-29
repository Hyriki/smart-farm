/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'viewer';

-- CreateTable
CREATE TABLE "Actuator" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "currentState" TEXT NOT NULL DEFAULT 'OFF',
    "toggledById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actuator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Telemetry" (
    "id" SERIAL NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "soilMoisture" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "lightIntensity" DOUBLE PRECISION,
    "ambientTemperature" DOUBLE PRECISION,
    "properties" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Frame" (
    "id" SERIAL NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "attribute" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Frame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDetection" (
    "id" SERIAL NOT NULL,
    "frameId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "boundingBox" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSensorView" (
    "userId" INTEGER NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSensorView_pkey" PRIMARY KEY ("userId","sensorId")
);

-- CreateTable
CREATE TABLE "UserDetectionView" (
    "userId" INTEGER NOT NULL,
    "detectionId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDetectionView_pkey" PRIMARY KEY ("userId","detectionId")
);

-- CreateTable
CREATE TABLE "SensorActuatorControl" (
    "sensorId" INTEGER NOT NULL,
    "actuatorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorActuatorControl_pkey" PRIMARY KEY ("sensorId","actuatorId")
);

-- CreateTable
CREATE TABLE "AlertTrigger" (
    "alertId" INTEGER NOT NULL,
    "detectionId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertTrigger_pkey" PRIMARY KEY ("alertId","detectionId")
);

-- CreateIndex
CREATE INDEX "Actuator_role_idx" ON "Actuator"("role");

-- CreateIndex
CREATE INDEX "Actuator_currentState_idx" ON "Actuator"("currentState");

-- CreateIndex
CREATE INDEX "Actuator_toggledById_idx" ON "Actuator"("toggledById");

-- CreateIndex
CREATE INDEX "Sensor_type_idx" ON "Sensor"("type");

-- CreateIndex
CREATE INDEX "Sensor_status_idx" ON "Sensor"("status");

-- CreateIndex
CREATE INDEX "Sensor_location_idx" ON "Sensor"("location");

-- CreateIndex
CREATE INDEX "Telemetry_sensorId_idx" ON "Telemetry"("sensorId");

-- CreateIndex
CREATE INDEX "Telemetry_timestamp_idx" ON "Telemetry"("timestamp");

-- CreateIndex
CREATE INDEX "Telemetry_sensorId_timestamp_idx" ON "Telemetry"("sensorId", "timestamp");

-- CreateIndex
CREATE INDEX "Frame_sensorId_idx" ON "Frame"("sensorId");

-- CreateIndex
CREATE INDEX "Frame_timestamp_idx" ON "Frame"("timestamp");

-- CreateIndex
CREATE INDEX "Frame_sensorId_timestamp_idx" ON "Frame"("sensorId", "timestamp");

-- CreateIndex
CREATE INDEX "AiDetection_frameId_idx" ON "AiDetection"("frameId");

-- CreateIndex
CREATE INDEX "AiDetection_role_idx" ON "AiDetection"("role");

-- CreateIndex
CREATE INDEX "AiDetection_confidenceScore_idx" ON "AiDetection"("confidenceScore");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "UserSensorView_sensorId_idx" ON "UserSensorView"("sensorId");

-- CreateIndex
CREATE INDEX "UserSensorView_viewedAt_idx" ON "UserSensorView"("viewedAt");

-- CreateIndex
CREATE INDEX "UserDetectionView_detectionId_idx" ON "UserDetectionView"("detectionId");

-- CreateIndex
CREATE INDEX "UserDetectionView_viewedAt_idx" ON "UserDetectionView"("viewedAt");

-- CreateIndex
CREATE INDEX "SensorActuatorControl_actuatorId_idx" ON "SensorActuatorControl"("actuatorId");

-- CreateIndex
CREATE INDEX "SensorActuatorControl_createdAt_idx" ON "SensorActuatorControl"("createdAt");

-- CreateIndex
CREATE INDEX "AlertTrigger_detectionId_idx" ON "AlertTrigger"("detectionId");

-- CreateIndex
CREATE INDEX "AlertTrigger_timestamp_idx" ON "AlertTrigger"("timestamp");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "Actuator" ADD CONSTRAINT "Actuator_toggledById_fkey" FOREIGN KEY ("toggledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Frame" ADD CONSTRAINT "Frame_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDetection" ADD CONSTRAINT "AiDetection_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSensorView" ADD CONSTRAINT "UserSensorView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSensorView" ADD CONSTRAINT "UserSensorView_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetectionView" ADD CONSTRAINT "UserDetectionView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetectionView" ADD CONSTRAINT "UserDetectionView_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "AiDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorActuatorControl" ADD CONSTRAINT "SensorActuatorControl_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorActuatorControl" ADD CONSTRAINT "SensorActuatorControl_actuatorId_fkey" FOREIGN KEY ("actuatorId") REFERENCES "Actuator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertTrigger" ADD CONSTRAINT "AlertTrigger_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertTrigger" ADD CONSTRAINT "AlertTrigger_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "AiDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
