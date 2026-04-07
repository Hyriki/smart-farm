import {
  createActuator,
  deleteActuator,
  getActuatorById,
  getActuators,
  toggleActuator,
  updateActuator,
} from '@/db/models/actuatorModel';
import { CreateActuatorInput, UpdateActuatorInput } from '@/types/sensor';

export async function createActuatorController(data: CreateActuatorInput) {
  if (!data.role) throw new Error('Actuator role is required');
  return createActuator(data);
}

export async function getActuatorsController() {
  return getActuators();
}

export async function getActuatorByIdController(actuatorId: number) {
  const actuator = await getActuatorById(actuatorId);
  if (!actuator) throw new Error('Actuator not found');
  return actuator;
}

export async function updateActuatorController(actuatorId: number, data: UpdateActuatorInput) {
  const actuator = await getActuatorById(actuatorId);
  if (!actuator) throw new Error('Actuator not found');
  return updateActuator(actuatorId, data);
}

export async function deleteActuatorController(actuatorId: number) {
  const actuator = await getActuatorById(actuatorId);
  if (!actuator) throw new Error('Actuator not found');
  return deleteActuator(actuatorId);
}

export async function toggleActuatorController(actuatorId: number, userId: number, nextState?: string) {
  const actuator = await toggleActuator(actuatorId, userId, nextState);
  if (!actuator) throw new Error('Actuator not found');
  return actuator;
}
