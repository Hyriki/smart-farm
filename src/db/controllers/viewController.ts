import {
  deleteUserDetectionView,
  deleteUserSensorView,
  getUserDetectionViews,
  getUserSensorViews,
  markDetectionViewed,
} from '@/db/models/viewModel';

// ─── UserSensorView ──────────────────────────────────────

export async function getUserSensorViewsController(userId: number) {
  return getUserSensorViews(userId);
}

export async function deleteUserSensorViewController(userId: number, sensorId: number) {
  return deleteUserSensorView(userId, sensorId);
}

// ─── UserDetectionView ───────────────────────────────────

export async function getUserDetectionViewsController(userId: number) {
  return getUserDetectionViews(userId);
}

export async function markDetectionViewedController(userId: number, detectionId: number) {
  return markDetectionViewed(userId, detectionId);
}

export async function deleteUserDetectionViewController(userId: number, detectionId: number) {
  return deleteUserDetectionView(userId, detectionId);
}
