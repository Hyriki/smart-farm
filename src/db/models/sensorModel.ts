'use server';

import { prisma } from '@/lib/prisma';
import { CreateSensorInput, CreateTelemetryInput, UpdateSensorInput } from '@/types/sensor';

export async function createSensor(data: CreateSensorInput) {
  return prisma.sensor.create({
    data: {
      type: data.type,
      location: data.location,
      status: data.status ?? 'offline',
    },
  });
}

export async function getSensors() {
  return prisma.sensor.findMany({
    include: {
      actuators: {
        include: {
          actuator: true,
        },
      },
      _count: {
        select: {
          telemetries: true,
          frames: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });
}

export async function getSensorById(id: number) {
  return prisma.sensor.findUnique({
    where: { id },
    include: {
      telemetries: {
        orderBy: { timestamp: 'desc' },
        take: 10,
      },
      frames: {
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          detections: true,
        },
      },
      actuators: {
        include: {
          actuator: true,
        },
      },
      _count: {
        select: {
          telemetries: true,
          frames: true,
          viewers: true,
        },
      },
    },
  });
}

export async function updateSensor(id: number, data: UpdateSensorInput) {
  return prisma.sensor.update({
    where: { id },
    data,
  });
}

export async function deleteSensor(id: number) {
  return prisma.sensor.delete({
    where: { id },
  });
}

export async function createTelemetry(sensorId: number, data: CreateTelemetryInput) {
  return prisma.telemetry.create({
    data: {
      sensorId: sensorId,
      soilMoisture: data.soilMoisture as number | null,
      humidity: data.humidity as number | null,
      lightIntensity: data.lightIntensity as number | null,
      ambientTemperature: data.ambientTemperature as number | null,
      properties: (data.properties as any) || undefined,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    },
  });
}

export async function getTelemetriesBySensorId(sensorId: number) {
  return prisma.telemetry.findMany({
    where: { sensorId },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
}

export async function markSensorViewed(userId: number, sensorId: number) {
  return prisma.userSensorView.upsert({
    where: {
      userId_sensorId: {
        userId,
        sensorId,
      },
    },
    update: {
      viewedAt: new Date(),
    },
    create: {
      userId,
      sensorId,
      viewedAt: new Date(),
    },
  });
}

export async function connectSensorToActuator(sensorId: number, actuatorId: number) {
  return prisma.sensorActuatorControl.upsert({
    where: {
      sensorId_actuatorId: {
        sensorId,
        actuatorId,
      },
    },
    update: {},
    create: {
      sensorId,
      actuatorId,
    },
    include: {
      sensor: true,
      actuator: true,
    },
  });
}

export async function getSensorActuators(sensorId: number) {
  return prisma.sensorActuatorControl.findMany({
    where: { sensorId },
    include: {
      actuator: true,
    },
    orderBy: {
      actuatorId: 'asc',
    },
  });
}
