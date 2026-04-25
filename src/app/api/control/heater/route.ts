import { publishMqtt } from '@/lib/mqtt/client';
import { updateActuatorByRole } from '@/db/models/actuatorModel';
import { requireAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    // Validate command
    if (!['ON', 'OFF'].includes(command)) {
      return NextResponse.json(
        { error: 'Invalid command. Use "ON" or "OFF"' },
        { status: 400 }
      );
    }

    // Authenticate user
    let userId: number | undefined;
    try {
      const user = requireAuth(request);
      userId = user.userId;
    } catch (e) {
      console.warn('[HeaterAPI] Unauthenticated request, proceeding without userId');
    }

    console.log(`[HeaterAPI] Sending command: ${command}`);

    // 1. Update Database State
    await updateActuatorByRole('heater', command, userId);

    // 2. Publish to ESP32 via MQTT
    await publishMqtt('yolofarm/control/heater', command);

    return NextResponse.json(
      { 
        success: true, 
        command,
        topic: 'yolofarm/control/heater',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[HeaterAPI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send heater command' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      info: 'POST heater command',
      example: { command: 'ON' },
      validCommands: ['ON', 'OFF'],
    },
    { status: 200 }
  );
}