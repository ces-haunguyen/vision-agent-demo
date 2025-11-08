// Type definitions for VisionAgents.ai streaming

export interface StreamConfig {
  apiKey: string;
  userId: string;
  callId: string;
}

export interface StreamToken {
  token: string;
  userId: string;
  callId: string;
  expiresAt: number;
}

export interface VideoStreamState {
  isConnected: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  error: string | null;
  stats: StreamStats | null;
}

export interface StreamStats {
  bitrate: number;
  fps: number;
  latency: number;
  resolution: {
    width: number;
    height: number;
  };
}

export type StreamStatus = 'idle' | 'connecting' | 'connected' | 'playing' | 'paused' | 'error';
