-- AlterTable
ALTER TABLE "Actuator" ADD COLUMN     "mode" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "sensorKey" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "sensorName" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_sensorKey_key" ON "Notification"("sensorKey");

-- CreateIndex
CREATE INDEX "Notification_isResolved_idx" ON "Notification"("isResolved");

-- CreateIndex
CREATE INDEX "Notification_sensorKey_idx" ON "Notification"("sensorKey");
