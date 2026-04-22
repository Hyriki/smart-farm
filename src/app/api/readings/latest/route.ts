import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get latest sensor readings
    return NextResponse.json(
      { message: 'Latest sensor readings' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch latest readings' },
      { status: 500 }
    );
  }
}
