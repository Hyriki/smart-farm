'use server';

import { prisma } from '@/lib/prisma';

// ─── UserSensorView ──────────────────────────────────────

export async function getUserSensorViews(userId: number) {
  return prisma.userSensorView.findMany({
    where: { userId },
    include: {
      sensor: {
        select: { id: true, type: true, location: true, status: true },
      },
    },
    orderBy: { viewedAt: 'desc' },
  });
}

export async function deleteUserSensorView(userId: number, sensorId: number) {
  return prisma.userSensorView.delete({
    where: {
      userId_sensorId: {
        userId,
        sensorId,
      },
    },
  });
}

// ─── UserDetectionView ───────────────────────────────────

export async function getUserDetectionViews(userId: number) {
  return prisma.userDetectionView.findMany({
    where: { userId },
    include: {
      detection: {
        select: { id: true, role: true, confidenceScore: true, createdAt: true },
      },
    },
    orderBy: { viewedAt: 'desc' },
  });
}

export async function markDetectionViewed(userId: number, detectionId: number) {
  return prisma.userDetectionView.upsert({
    where: {
      userId_detectionId: {
        userId,
        detectionId,
      },
    },
    update: {
      viewedAt: new Date(),
    },
    create: {
      userId,
      detectionId,
      viewedAt: new Date(),
    },
  });
}

export async function deleteUserDetectionView(userId: number, detectionId: number) {
  return prisma.userDetectionView.delete({
    where: {
      userId_detectionId: {
        userId,
        detectionId,
      },
    },
  });
}
