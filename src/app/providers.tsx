"use client";

import { NotificationProvider } from "@/lib/notifications";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
