import {
  connectSensorToActuator,
  createSensor,
  createTelemetry,
  deleteSensor,
  getSensorActuators,
  getSensorById,
  getSensors,
  getTelemetriesBySensorId,
  markSensorViewed,
  updateSensor,
} from '@/db/models/sensorModel';
import { getActuatorById } from '@/db/models/actuatorModel';
import { CreateSensorInput, CreateTelemetryInput, UpdateSensorInput } from '@/types/sensor';

export async function createSensorController(data: CreateSensorInput) {
  if (!data.type) throw new Error('Sensor type is required');
  return createSensor(data);
}

export async function getSensorsController() {
  return getSensors();
}

export async function getSensorByIdController(sensorId: number, userId?: number) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');

  if (userId) {
    await markSensorViewed(userId, sensorId);
  }

  return sensor;
}

export async function updateSensorController(sensorId: number, data: UpdateSensorInput) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');
  return updateSensor(sensorId, data);
}

export async function deleteSensorController(sensorId: number) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');
  return deleteSensor(sensorId);
}

export async function createTelemetryController(sensorId: number, data: CreateTelemetryInput) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');
  return createTelemetry(sensorId, data);
}

export async function getSensorTelemetriesController(sensorId: number) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');
  return getTelemetriesBySensorId(sensorId);
}

export async function connectSensorToActuatorController(sensorId: number, actuatorId: number) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');

  const actuator = await getActuatorById(actuatorId);
  if (!actuator) throw new Error('Actuator not found');

  return connectSensorToActuator(sensorId, actuatorId);
}

export async function getSensorActuatorsController(sensorId: number) {
  const sensor = await getSensorById(sensorId);
  if (!sensor) throw new Error('Sensor not found');
  return getSensorActuators(sensorId);
}
