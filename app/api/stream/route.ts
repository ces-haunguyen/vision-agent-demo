// API route for managing VisionAgents.ai stream sessions

import { NextRequest, NextResponse } from 'next/server';
import { VisionAgentClient } from '@/lib/streamClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, callId } = body;

    if (!userId || !callId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and callId' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Stream API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Stream client
    const client = new VisionAgentClient(apiKey);

    // Get stream token (in production, this would also use the secret key)
    const token = await client.initializeStream(userId, callId);

    return NextResponse.json({
      success: true,
      token: token.token,
      userId: token.userId,
      callId: token.callId,
      expiresAt: token.expiresAt,
      config: client.getConfig(userId, callId),
    });
  } catch (error) {
    console.error('Stream initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize stream session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'VisionAgents.ai Stream API',
    endpoints: {
      POST: 'Initialize a new stream session',
    },
  });
}
