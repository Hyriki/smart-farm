'use server';

import { prisma } from '@/lib/prisma';
import { CreateFrameInput, UpdateFrameInput } from '@/types/sensor';

export async function createFrame(data: CreateFrameInput) {
  return prisma.frame.create({
    data: {
      sensorId: data.sensorId,
      attribute: data.attribute ? JSON.stringify(data.attribute) : undefined,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    },
  });
}

export async function getFrames(limit = 50, offset = 0) {
  return prisma.frame.findMany({
    include: {
      sensor: {
        select: { id: true, type: true, location: true },
      },
      _count: {
        select: { detections: true },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function getFrameById(id: number) {
  return prisma.frame.findUnique({
    where: { id },
    include: {
      sensor: {
        select: { id: true, type: true, location: true },
      },
      detections: true,
    },
  });
}

export async function getFramesBySensorId(sensorId: number, limit = 50) {
  return prisma.frame.findMany({
    where: { sensorId },
    include: {
      _count: {
        select: { detections: true },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

export async function updateFrame(id: number, data: UpdateFrameInput) {
  return prisma.frame.update({
    where: { id },
    data: {
      attribute: data.attribute ? JSON.stringify(data.attribute) : undefined,
    },
  });
}

export async function deleteFrame(id: number) {
  return prisma.frame.delete({
    where: { id },
  });
}
