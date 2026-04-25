import { publishMqtt } from '@/lib/mqtt/client';
import { updateActuatorByRole } from '@/db/models/actuatorModel';
import { requireAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    // Validate command
    if (!['AUTO', 'OFF'].includes(command)) {
      return NextResponse.json(
        { error: 'Invalid command. Use "AUTO" or "OFF"' },
        { status: 400 }
      );
    }

    // Authenticate user
    let userId: number | undefined;
    try {
      const user = requireAuth(request);
      userId = user.userId;
    } catch (e) {
      console.warn('[BuzzerAPI] Unauthenticated request, proceeding without userId');
    }

    console.log(`[BuzzerAPI] Sending command: ${command}`);

    // 1. Update Database State
    await updateActuatorByRole('buzzer', command, userId);

    // 2. Publish to ESP32 via MQTT
    await publishMqtt('yolofarm/control/buzzer', command);

    return NextResponse.json(
      { 
        success: true, 
        command,
        topic: 'yolofarm/control/buzzer',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[BuzzerAPI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send buzzer command' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      info: 'POST buzzer command',
      example: { command: 'AUTO' },
      validCommands: ['AUTO', 'OFF'],
    },
    { status: 200 }
  );
}