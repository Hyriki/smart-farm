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
  soilMoisture?: number;
  humidity?: number;
  lightIntensity?: number;
  ambientTemperature?: number;
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
