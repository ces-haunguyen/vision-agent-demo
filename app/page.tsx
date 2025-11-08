'use client';

import { useState, useEffect } from 'react';
import VideoStream from '@/components/VideoStream';
import { generateUserId, generateCallId } from '@/lib/streamClient';

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [callId, setCallId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Generate unique IDs on client-side to avoid hydration issues
    setUserId(generateUserId());
    setCallId(generateCallId());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="container">
        <div className="loading">Loading...</div>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <h1>VisionAgents.ai Video Streaming Demo</h1>
        <p className="subtitle">
          Real-time video streaming powered by VisionAgents.ai and Stream&apos;s edge network
        </p>
      </header>

      <div className="content">
        <section className="stream-section">
          <h2>Live Stream</h2>
          <VideoStream userId={userId} callId={callId} />
        </section>

        <aside className="info-section">
          <h3>About This Demo</h3>
          <p>
            This demo showcases VisionAgents.ai video streaming capabilities integrated
            with Next.js. The stream uses WebRTC for ultra-low latency video delivery.
          </p>

          <div className="session-info">
            <h4>Session Information</h4>
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <code className="info-value">{userId}</code>
            </div>
            <div className="info-item">
              <span className="info-label">Call ID:</span>
              <code className="info-value">{callId}</code>
            </div>
          </div>

          <div className="features">
            <h4>Features</h4>
            <ul>
              <li>Real-time WebRTC streaming</li>
              <li>Low-latency video delivery (sub-30ms)</li>
              <li>Stream controls (Play, Pause, Stop)</li>
              <li>Live stream statistics</li>
              <li>Automatic reconnection handling</li>
            </ul>
          </div>

          <div className="tech-stack">
            <h4>Technology Stack</h4>
            <ul>
              <li>Next.js 14 (App Router)</li>
              <li>React 18</li>
              <li>TypeScript</li>
              <li>VisionAgents.ai SDK</li>
              <li>Stream Video API</li>
              <li>WebRTC</li>
            </ul>
          </div>
        </aside>
      </div>

      <footer className="footer">
        <p>
          Powered by{' '}
          <a href="https://visionagents.ai" target="_blank" rel="noopener noreferrer">
            VisionAgents.ai
          </a>
          {' '}&amp;{' '}
          <a href="https://getstream.io" target="_blank" rel="noopener noreferrer">
            Stream
          </a>
        </p>
      </footer>
    </main>
  );
}
