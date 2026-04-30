"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";

// Matches the DB Notification model.
export interface Notification {
  id: number;         // DB primary key
  sensorKey: string;  // "soil_moisture" | "temperature" | "humidity" | "light_intensity"
  type: string;       // "warning"
  message: string;    // human-readable description
  time: string;       // formatted from DB updatedAt (HH:mm:ss)
  sensorName: string;
  currentValue: number;
  threshold: number;
  unit: string;
}

type NotificationContextType = {
  notifications: Notification[];
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  setNotifications: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

// Maps a raw API notification record to the frontend Notification type.
export function mapApiNotification(n: {
  id: number;
  sensorKey: string;
  type: string;
  message: string;
  sensorName: string;
  currentValue: number;
  threshold: number;
  unit: string;
  updatedAt: string;
}): Notification {
  const d = new Date(n.updatedAt);
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
  return {
    id: n.id,
    sensorKey: n.sensorKey,
    type: n.type,
    message: n.message,
    time,
    sensorName: n.sensorName,
    currentValue: n.currentValue,
    threshold: n.threshold,
    unit: n.unit,
  };
}
