export type CreateSensorInput = {
  type: string;
  location?: string;
  status?: string;
};

export type UpdateSensorInput = {
  type?: string;
  location?: string | null;
  status?: string;
};

export type CreateTelemetryInput = {
  soilMoisture?: number | null;
  humidity?: number | null;
  lightIntensity?: number | null;
  ambientTemperature?: number | null;
  properties?: Record<string, unknown> | null;
  timestamp?: string;
};

export type CreateActuatorInput = {
  role: string;
  currentState?: string;
};

export type UpdateActuatorInput = {
  role?: string;
  currentState?: string;
};

export type CreateFrameInput = {
  sensorId: number;
  attribute?: Record<string, unknown> | null;
  timestamp?: string;
};

export type UpdateFrameInput = {
  attribute?: Record<string, unknown> | null;
};

export type CreateAlertInput = {
  type: string;
  severity: string;
};

export type UpdateAlertInput = {
  type?: string;
  severity?: string;
};

export type CreateAlertTriggerInput = {
  alertId: number;
  detectionId: number;
};
