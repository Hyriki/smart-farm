'use server';

import { prisma } from '@/lib/prisma';

export async function getAllTelemetries(limit = 50, offset = 0) {
  return prisma.telemetry.findMany({
    include: {
      sensor: {
        select: { id: true, type: true, location: true, status: true },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function getTelemetryById(id: number) {
  return prisma.telemetry.findUnique({
    where: { id },
    include: {
      sensor: {
        select: { id: true, type: true, location: true, status: true },
      },
    },
  });
}

export async function getLatestTelemetryPerSensor() {
  // Get all sensors then fetch their latest telemetry
  const sensors = await prisma.sensor.findMany({
    include: {
      telemetries: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
    orderBy: { id: 'asc' },
  });

  return sensors.map((sensor) => ({
    sensorId: sensor.id,
    sensorType: sensor.type,
    location: sensor.location,
    status: sensor.status,
    latest: sensor.telemetries[0] ?? null,
  }));
}

export async function getTelemetryHistory(options: {
  sensorId?: number;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const { sensorId, from, to, limit = 100, offset = 0 } = options;

  const where: Record<string, unknown> = {};
  if (sensorId) where.sensorId = sensorId;
  if (from || to) {
    where.timestamp = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.telemetry.findMany({
      where,
      include: {
        sensor: {
          select: { id: true, type: true, location: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.telemetry.count({ where }),
  ]);

  return { data, total, limit, offset };
}

export async function deleteTelemetry(id: number) {
  return prisma.telemetry.delete({
    where: { id },
  });
}
