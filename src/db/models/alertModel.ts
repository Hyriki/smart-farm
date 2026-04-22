'use server';

import { prisma } from '@/lib/prisma';
import { CreateAlertInput, UpdateAlertInput } from '@/types/sensor';

// ─── Alert ────────────────────────────────────────────────

export async function createAlert(data: CreateAlertInput) {
  return prisma.alert.create({
    data: {
      type: data.type,
      severity: data.severity,
    },
  });
}

export async function getAlerts() {
  return prisma.alert.findMany({
    include: {
      _count: {
        select: { detections: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAlertById(id: number) {
  return prisma.alert.findUnique({
    where: { id },
    include: {
      detections: {
        include: {
          detection: true,
        },
        orderBy: { timestamp: 'desc' },
      },
    },
  });
}

export async function updateAlert(id: number, data: UpdateAlertInput) {
  return prisma.alert.update({
    where: { id },
    data,
  });
}

export async function deleteAlert(id: number) {
  return prisma.alert.delete({
    where: { id },
  });
}

// ─── AlertTrigger ─────────────────────────────────────────

export async function createAlertTrigger(alertId: number, detectionId: number) {
  return prisma.alertTrigger.upsert({
    where: {
      alertId_detectionId: {
        alertId,
        detectionId,
      },
    },
    update: {
      timestamp: new Date(),
    },
    create: {
      alertId,
      detectionId,
    },
    include: {
      alert: true,
      detection: true,
    },
  });
}

export async function getAlertTriggers(alertId: number) {
  return prisma.alertTrigger.findMany({
    where: { alertId },
    include: {
      detection: true,
    },
    orderBy: { timestamp: 'desc' },
  });
}

export async function deleteAlertTrigger(alertId: number, detectionId: number) {
  return prisma.alertTrigger.delete({
    where: {
      alertId_detectionId: {
        alertId,
        detectionId,
      },
    },
  });
}
