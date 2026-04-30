import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";

async function main() {
  // ─── User ─────────────────────────────────────────────────────────────────
  const password = await hashPassword("2503");
  await prisma.user.upsert({
    where: { email: "duongbaolong2503@gmail.com" },
    update: { password, isVerified: true, role: "viewer" },
    create: {
      name: "Bao Long",
      email: "duongbaolong2503@gmail.com",
      password,
      role: "viewer",
      isVerified: true,
    },
  });

  // ─── Sensor (id = 1, hardcoded in sensorDataHandler) ──────────────────────
  await prisma.sensor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      type: "ESP32",
      location: "Greenhouse 1",
      status: "online",
    },
  });

  // ─── Heater actuator ──────────────────────────────────────────────────────
  const heater = await prisma.actuator.findFirst({ where: { role: "heater" } });
  if (!heater) {
    await prisma.actuator.create({
      data: { role: "heater", currentState: "OFF" },
    });
    console.log("✓ Heater actuator created");
  } else {
    console.log("  Heater actuator already exists, skipping");
  }

  // ─── Buzzer actuator ──────────────────────────────────────────────────────
  const buzzer = await prisma.actuator.findFirst({ where: { role: "buzzer" } });
  if (!buzzer) {
    await prisma.actuator.create({
      data: { role: "buzzer", currentState: "OFF", mode: "OFF" },
    });
    console.log("✓ Buzzer actuator created");
  } else if (buzzer.mode === null || buzzer.mode === undefined) {
    // Migrate: currentState was storing the mode — preserve it, reset hardware state.
    const migratedMode = buzzer.currentState === "AUTO" ? "AUTO" : "OFF";
    await prisma.actuator.update({
      where: { id: buzzer.id },
      data: { mode: migratedMode, currentState: "OFF" },
    });
    console.log(`✓ Buzzer migrated: mode=${migratedMode}, currentState=OFF`);
  } else {
    console.log("  Buzzer actuator already exists, skipping");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
