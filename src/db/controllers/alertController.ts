import {
  createAlert,
  createAlertTrigger,
  deleteAlert,
  deleteAlertTrigger,
  getAlertById,
  getAlerts,
  getAlertTriggers,
  updateAlert,
} from '@/db/models/alertModel';
import { CreateAlertInput, UpdateAlertInput } from '@/types/sensor';

// ─── Alert ────────────────────────────────────────────────

export async function createAlertController(data: CreateAlertInput) {
  if (!data.type) throw new Error('Alert type is required');
  if (!data.severity) throw new Error('Alert severity is required');
  return createAlert(data);
}

export async function getAlertsController() {
  return getAlerts();
}

export async function getAlertByIdController(id: number) {
  const alert = await getAlertById(id);
  if (!alert) throw new Error('Alert not found');
  return alert;
}

export async function updateAlertController(id: number, data: UpdateAlertInput) {
  const alert = await getAlertById(id);
  if (!alert) throw new Error('Alert not found');
  return updateAlert(id, data);
}

export async function deleteAlertController(id: number) {
  const alert = await getAlertById(id);
  if (!alert) throw new Error('Alert not found');
  return deleteAlert(id);
}

// ─── AlertTrigger ─────────────────────────────────────────

export async function createAlertTriggerController(alertId: number, detectionId: number) {
  const alert = await getAlertById(alertId);
  if (!alert) throw new Error('Alert not found');
  return createAlertTrigger(alertId, detectionId);
}

export async function getAlertTriggersController(alertId: number) {
  const alert = await getAlertById(alertId);
  if (!alert) throw new Error('Alert not found');
  return getAlertTriggers(alertId);
}

export async function deleteAlertTriggerController(alertId: number, detectionId: number) {
  const alert = await getAlertById(alertId);
  if (!alert) throw new Error('Alert not found');
  return deleteAlertTrigger(alertId, detectionId);
}
