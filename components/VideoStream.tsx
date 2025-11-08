'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoStreamState, StreamStatus } from '@/types/stream';

interface VideoStreamProps {
  userId: string;
  callId: string;
}

export default function VideoStream({ userId, callId }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [streamState, setStreamState] = useState<VideoStreamState>({
    isConnected: false,
    isPlaying: false,
    isPaused: false,
    error: null,
    stats: null,
  });
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize stream session
  const initializeStream = async () => {
    try {
      setStatus('connecting');
      setStreamState(prev => ({ ...prev, error: null }));

      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, callId }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize stream');
      }

      const data = await response.json();
      setStreamToken(data.token);

      // Simulate WebRTC connection
      await setupWebRTCConnection();

      setStatus('connected');
      setStreamState(prev => ({
        ...prev,
        isConnected: true,
        stats: {
          bitrate: 2500,
          fps: 30,
          latency: 25,
          resolution: { width: 1280, height: 720 },
        }
      }));
    } catch (error) {
      console.error('Stream initialization error:', error);
      setStatus('error');
      setStreamState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  // Setup WebRTC connection (simplified demo version)
  const setupWebRTCConnection = async () => {
    return new Promise<void>((resolve) => {
      // In a real implementation, this would:
      // 1. Create RTCPeerConnection with STUN/TURN servers
      // 2. Exchange SDP offers/answers with the server
      // 3. Handle ICE candidates
      // 4. Connect to Stream's edge network

      // For demo purposes, we'll use getUserMedia to show local camera
      // This simulates receiving a stream from VisionAgents
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          resolve();
        })
        .catch(() => {
          // If camera access fails, create a mock stream
          console.log('Camera not available, using simulated stream');
          resolve();
        });
    });
  };

  // Play the stream
  const handlePlay = async () => {
    if (!streamState.isConnected) {
      await initializeStream();
    }

    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setStatus('playing');
        setStreamState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      } catch (error) {
        console.error('Play error:', error);
        setStreamState(prev => ({
          ...prev,
          error: 'Failed to play stream',
        }));
      }
    }
  };

  // Pause the stream
  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setStatus('paused');
      setStreamState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    }
  };

  // Stop the stream
  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    // Close WebRTC connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setStatus('idle');
    setStreamState({
      isConnected: false,
      isPlaying: false,
      isPaused: false,
      error: null,
      stats: null,
    });
    setStreamToken(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  return (
    <div className="video-stream-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          autoPlay
          playsInline
          muted
        >
          Your browser does not support video streaming.
        </video>

        {!streamState.isConnected && (
          <div className="video-placeholder">
            <div className="placeholder-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p>Click Play to start streaming</p>
            </div>
          </div>
        )}

        {status === 'connecting' && (
          <div className="status-overlay">
            <div className="spinner"></div>
            <p>Connecting to stream...</p>
          </div>
        )}
      </div>

      {/* Stream Controls */}
      <div className="controls">
        <button
          onClick={handlePlay}
          disabled={status === 'playing' || status === 'connecting'}
          className="btn btn-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play
        </button>

        <button
          onClick={handlePause}
          disabled={!streamState.isPlaying}
          className="btn btn-secondary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
          Pause
        </button>

        <button
          onClick={handleStop}
          disabled={!streamState.isConnected}
          className="btn btn-danger"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
          Stop
        </button>
      </div>

      {/* Stream Stats */}
      {streamState.stats && (
        <div className="stream-stats">
          <div className="stat-item">
            <span className="stat-label">Status:</span>
            <span className={`stat-value status-${status}`}>{status}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Resolution:</span>
            <span className="stat-value">
              {streamState.stats.resolution.width}x{streamState.stats.resolution.height}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">FPS:</span>
            <span className="stat-value">{streamState.stats.fps}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Latency:</span>
            <span className="stat-value">{streamState.stats.latency}ms</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Bitrate:</span>
            <span className="stat-value">{streamState.stats.bitrate}kbps</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {streamState.error && (
        <div className="error-message">
          <strong>Error:</strong> {streamState.error}
        </div>
      )}
    </div>
  );
}
