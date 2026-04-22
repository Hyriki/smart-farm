import {
  createFrame,
  deleteFrame,
  getFrameById,
  getFrames,
  getFramesBySensorId,
  updateFrame,
} from '@/db/models/frameModel';
import { getSensorById } from '@/db/models/sensorModel';
import { CreateFrameInput, UpdateFrameInput } from '@/types/sensor';

export async function createFrameController(data: CreateFrameInput) {
  const sensor = await getSensorById(data.sensorId);
  if (!sensor) throw new Error('Sensor not found');
  return createFrame(data);
}

export async function getFramesController(limit?: number, offset?: number) {
  return getFrames(limit, offset);
}

export async function getFrameByIdController(id: number) {
  const frame = await getFrameById(id);
  if (!frame) throw new Error('Frame not found');
  return frame;
}

export async function getFramesBySensorIdController(sensorId: number, limit?: number) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');
  return getFramesBySensorId(sensorId, limit);
}

export async function updateFrameController(id: number, data: UpdateFrameInput) {
  const frame = await getFrameById(id);
  if (!frame) throw new Error('Frame not found');
  return updateFrame(id, data);
}

export async function deleteFrameController(id: number) {
  const frame = await getFrameById(id);
  if (!frame) throw new Error('Frame not found');
  return deleteFrame(id);
}
