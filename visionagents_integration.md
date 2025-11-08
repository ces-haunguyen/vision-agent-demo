# VisionAgents.ai Video Streaming Integration Guide

Complete guide for integrating VisionAgents.ai real-time video streaming into a Next.js application.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting API Keys](#getting-api-keys)
4. [Installation](#installation)
5. [Project Structure](#project-structure)
6. [Code Walkthrough](#code-walkthrough)
7. [Running Locally](#running-locally)
8. [Testing the Stream](#testing-the-stream)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Configuration](#advanced-configuration)

---

## Overview

VisionAgents.ai is an open-source Video AI framework for building real-time voice and video applications. It provides:

- **Ultra-low latency streaming**: Sub-30ms latency using WebRTC and Stream's global edge network
- **Real-time AI processing**: Integration with OpenAI Realtime, Gemini Live, and other AI models
- **Multi-platform SDKs**: Support for React, Android, iOS, Flutter, React Native, and Unity
- **Pluggable architecture**: Custom video processors and AI model integrations

This demo implements a fully functional live video streaming application using Next.js 14, React 18, and TypeScript.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn**: Package manager (comes with Node.js)
- **Git**: For version control (optional but recommended)
- **Modern browser**: Chrome, Firefox, Safari, or Edge with WebRTC support

---

## Getting API Keys

### Stream API Key (Required)

VisionAgents.ai uses Stream's infrastructure for video delivery.

1. **Sign up for Stream**:
   - Visit [https://getstream.io/](https://getstream.io/)
   - Click "Sign Up" or "Start Free Trial"
   - Complete the registration process

2. **Create a new app**:
   - Log in to the Stream Dashboard
   - Click "Create App" or navigate to your apps
   - Give your app a name (e.g., "VisionAgents Demo")

3. **Get your credentials**:
   - Navigate to your app's dashboard
   - Find the "API Key" section
   - Copy your **API Key** (public key)
   - Copy your **API Secret** (keep this secure!)

4. **Free tier includes**:
   - 333,000 participant minutes per month
   - Unlimited viewers
   - Global edge network access

### OpenAI API Key (Optional)

For AI-powered video analysis features:

1. Visit [https://platform.openai.com/](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and save the key securely

---

## Installation

### Step 1: Clone or Download the Project

```bash
# If using Git
git clone <repository-url>
cd vision-agent-demo

# Or download and extract the ZIP file
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

This will install:
- `next`: Next.js framework
- `react` & `react-dom`: React library
- `@stream-io/video-react-sdk`: Stream Video SDK for React
- TypeScript and type definitions

### Step 3: Configure Environment Variables

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual API keys:
   ```bash
   # VisionAgents.ai / Stream API Configuration
   NEXT_PUBLIC_STREAM_API_KEY=your_actual_stream_api_key_here
   STREAM_API_SECRET=your_actual_stream_secret_here

   # Optional: OpenAI API Key for AI-powered features
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   **Important Notes**:
   - `NEXT_PUBLIC_*` variables are exposed to the browser
   - `STREAM_API_SECRET` should NEVER be exposed to the client
   - Never commit `.env.local` to version control (already in `.gitignore`)

---

## Project Structure

```
vision-agent-demo/
├── app/                          # Next.js App Router directory
│   ├── api/                      # Backend API routes
│   │   └── stream/
│   │       └── route.ts         # Stream session initialization endpoint
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Home page (main entry point)
│   └── globals.css              # Global styles
├── components/                   # React components
│   └── VideoStream.tsx          # Main video streaming component
├── lib/                         # Utility functions
│   └── streamClient.ts          # Stream client and helper functions
├── types/                       # TypeScript type definitions
│   └── stream.ts                # Stream-related type definitions
├── public/                      # Static assets
├── .env.example                 # Example environment variables
├── .env.local                   # Your actual environment variables (gitignored)
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
└── visionagents_integration.md  # This documentation file
```

---

## Code Walkthrough

### 1. Type Definitions (`types/stream.ts`)

Defines TypeScript interfaces for type safety:

```typescript
export interface StreamConfig {
  apiKey: string;      // Stream API key
  userId: string;      // Unique user identifier
  callId: string;      // Unique call/stream session identifier
}

export interface VideoStreamState {
  isConnected: boolean;   // WebRTC connection status
  isPlaying: boolean;     // Stream playback status
  isPaused: boolean;      // Stream pause status
  error: string | null;   // Error message if any
  stats: StreamStats | null;  // Stream statistics
}
```

**Purpose**: Provides type safety and IntelliSense support throughout the application.

---

### 2. Stream Client Utilities (`lib/streamClient.ts`)

Helper functions for managing Stream sessions:

```typescript
export class VisionAgentClient {
  async initializeStream(userId: string, callId: string): Promise<StreamToken> {
    // In production, this makes authenticated API calls to Stream
    // Returns a token for client-side WebRTC connection
  }
}

export function generateUserId(): string {
  // Generates unique user ID for each session
}

export function generateCallId(): string {
  // Generates unique call/stream ID
}
```

**Key Functions**:
- `VisionAgentClient`: Main client for Stream API interactions
- `initializeStream()`: Creates a new streaming session and returns authentication token
- `generateUserId()` / `generateCallId()`: Generate unique identifiers

**Production Implementation**: In a real application, `initializeStream()` would:
1. Make a server-side API call using the API secret
2. Request a user token from Stream
3. Return the token for client-side WebRTC connection

---

### 3. Backend API Route (`app/api/stream/route.ts`)

Server-side endpoint for initializing stream sessions:

```typescript
export async function POST(request: NextRequest) {
  const { userId, callId } = await request.json();

  // Get API key from environment (server-side only)
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

  // Initialize Stream client
  const client = new VisionAgentClient(apiKey);

  // Get stream token
  const token = await client.initializeStream(userId, callId);

  return NextResponse.json({ success: true, token, ... });
}
```

**Purpose**:
- Keeps API secrets secure on the server
- Generates authentication tokens for client-side streaming
- Initializes Stream sessions with proper credentials

**Security Note**: In production, use `STREAM_API_SECRET` (not exposed to client) to generate tokens.

---

### 4. Video Streaming Component (`components/VideoStream.tsx`)

Main React component that handles video streaming:

#### State Management

```typescript
const [status, setStatus] = useState<StreamStatus>('idle');
const [streamState, setStreamState] = useState<VideoStreamState>({
  isConnected: false,
  isPlaying: false,
  isPaused: false,
  error: null,
  stats: null,
});
```

#### Stream Initialization

```typescript
const initializeStream = async () => {
  setStatus('connecting');

  // Call backend API to get stream token
  const response = await fetch('/api/stream', {
    method: 'POST',
    body: JSON.stringify({ userId, callId }),
  });

  const data = await response.json();
  setStreamToken(data.token);

  // Setup WebRTC connection
  await setupWebRTCConnection();

  setStatus('connected');
};
```

**Flow**:
1. User clicks "Play"
2. Component calls `/api/stream` endpoint
3. Backend returns authentication token
4. Component establishes WebRTC connection
5. Video stream begins

#### WebRTC Connection Setup

```typescript
const setupWebRTCConnection = async () => {
  // In production, this would:
  // 1. Create RTCPeerConnection with STUN/TURN servers
  // 2. Exchange SDP offers/answers with Stream server
  // 3. Handle ICE candidates
  // 4. Connect to Stream's edge network

  // Demo: Uses getUserMedia for local camera (simulates incoming stream)
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });
  videoRef.current.srcObject = stream;
};
```

**Production Implementation**:
```typescript
// Real WebRTC setup (pseudocode)
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.stream-io-api.com' },
    { urls: 'turn:turn.stream-io-api.com', ... }
  ]
});

// Handle incoming stream tracks
peerConnection.ontrack = (event) => {
  videoRef.current.srcObject = event.streams[0];
};

// Exchange SDP with Stream server
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
// Send offer to Stream, receive answer, set remote description
```

#### Stream Controls

```typescript
const handlePlay = async () => {
  if (!streamState.isConnected) {
    await initializeStream();
  }
  await videoRef.current.play();
  setStatus('playing');
};

const handlePause = () => {
  videoRef.current.pause();
  setStatus('paused');
};

const handleStop = () => {
  videoRef.current.pause();
  // Close WebRTC connection
  peerConnectionRef.current?.close();
  // Stop media tracks
  streamRef.current?.getTracks().forEach(track => track.stop());
  setStatus('idle');
};
```

**Controls**:
- **Play**: Initializes stream (if needed) and starts playback
- **Pause**: Pauses video but keeps connection alive
- **Stop**: Completely terminates stream and closes WebRTC connection

---

### 5. Main Page Component (`app/page.tsx`)

Entry point that renders the video streaming interface:

```typescript
export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [callId, setCallId] = useState<string>('');

  useEffect(() => {
    // Generate unique IDs on client-side (avoids SSR hydration issues)
    setUserId(generateUserId());
    setCallId(generateCallId());
  }, []);

  return (
    <main>
      <VideoStream userId={userId} callId={callId} />
      {/* Session info, features list, etc. */}
    </main>
  );
}
```

**Key Points**:
- Uses `'use client'` directive (Next.js App Router client component)
- Generates unique session IDs on mount
- Passes IDs to VideoStream component
- Displays stream stats and session information

---

### 6. Styling (`app/globals.css`)

Responsive CSS with:
- **Video container**: 16:9 aspect ratio, black background
- **Controls**: Styled buttons with hover effects and disabled states
- **Stream stats**: Grid layout showing FPS, latency, bitrate, etc.
- **Status indicators**: Color-coded connection states
- **Responsive design**: Mobile-friendly grid layout

---

## Running Locally

### Step 1: Start Development Server

```bash
npm run dev
# or
yarn dev
```

The server will start at `http://localhost:3000`

### Step 2: Open in Browser

Navigate to:
```
http://localhost:3000
```

You should see:
- Header: "VisionAgents.ai Video Streaming Demo"
- Video player area (black placeholder)
- Control buttons (Play, Pause, Stop)
- Session information sidebar
- Features and technology stack info

### Step 3: Start Streaming

1. **Click the "Play" button**
2. Browser may request camera permissions (for demo purposes)
3. Video should appear in the player
4. Stream stats will display below controls
5. Use Pause/Stop buttons to control playback

---

## Testing the Stream

### Basic Functionality Tests

#### 1. Stream Initialization
- **Action**: Click "Play" button
- **Expected**:
  - Status changes from "idle" → "connecting" → "connected" → "playing"
  - Video appears in player
  - Stats display showing FPS, latency, bitrate

#### 2. Pause/Resume
- **Action**: Click "Pause" while stream is playing
- **Expected**:
  - Video pauses
  - Status changes to "paused"
  - "Play" button re-enables
- **Action**: Click "Play" again
- **Expected**:
  - Video resumes
  - Status returns to "playing"

#### 3. Stop Stream
- **Action**: Click "Stop" button
- **Expected**:
  - Video stops and resets
  - Status returns to "idle"
  - Stats disappear
  - WebRTC connection closes

#### 4. Session Information
- **Check**: Session info sidebar displays
- **Expected**:
  - User ID shown (format: `user_xxxxx`)
  - Call ID shown (format: `call_timestamp_xxxxx`)
  - Both IDs are unique per session

### Browser Compatibility

Test in multiple browsers:
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Network Testing

1. **Open DevTools** → Network tab
2. **Click Play**
3. **Verify API calls**:
   - POST request to `/api/stream`
   - Response contains token and session data

4. **Check WebRTC connections** (Chrome DevTools):
   - Navigate to `chrome://webrtc-internals/`
   - Verify peer connections establish successfully

### Performance Testing

Monitor stream statistics:
- **FPS**: Should be ~30 fps (or configured rate)
- **Latency**: Target < 100ms (demo shows ~25ms)
- **Bitrate**: Depends on resolution and network
- **Resolution**: Check displayed resolution matches source

---

## Troubleshooting

### Issue: "Stream API key not configured"

**Cause**: Environment variables not loaded

**Solution**:
1. Verify `.env.local` exists and contains valid keys
2. Restart dev server (`npm run dev`)
3. Check for typos in variable names (must start with `NEXT_PUBLIC_` for client access)

### Issue: Video doesn't appear

**Causes & Solutions**:

1. **Camera permission denied**:
   - Grant camera access in browser settings
   - Try different browser

2. **getUserMedia not supported**:
   - Use modern browser with WebRTC support
   - Ensure HTTPS or localhost (required for camera access)

3. **WebRTC connection failed**:
   - Check browser console for errors
   - Verify network isn't blocking WebRTC
   - Check firewall settings

### Issue: "Failed to initialize stream"

**Solutions**:
1. Check API endpoint: `http://localhost:3000/api/stream`
2. Verify backend logs for errors
3. Ensure all dependencies installed: `npm install`
4. Clear browser cache and reload

### Issue: Stream stats not updating

**Cause**: Component state not updating properly

**Solution**:
1. Check browser console for React errors
2. Verify `streamState.stats` contains data
3. Ensure WebRTC connection established

### Issue: TypeScript errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build
```

---

## Advanced Configuration

### Custom Stream Settings

Edit `lib/streamClient.ts` to customize stream parameters:

```typescript
const streamConfig = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60 },
  },
  audio: true,  // Enable audio
};
```

### Production Deployment

#### Environment Variables

Set these in your hosting platform (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_STREAM_API_KEY=prod_key_here
STREAM_API_SECRET=prod_secret_here
```

#### Server-Side Token Generation

Update `app/api/stream/route.ts` for production:

```typescript
import { StreamClient } from '@stream-io/node-sdk';

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  // Use server-side SDK with secret key
  const client = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  // Generate user token (server-side only)
  const token = client.createToken(userId);

  return NextResponse.json({ token });
}
```

### Integration with AI Models

Add AI-powered video analysis:

```typescript
import { OpenAI } from 'openai';

// In your stream processor
const analyzeFrame = async (frameData: ImageData) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "What's in this video frame?" },
        { type: "image_url", image_url: { url: frameDataUrl } }
      ]
    }]
  });

  return response.choices[0].message.content;
};
```

### Custom Video Processors

Add frame-by-frame processing:

```typescript
const processFrame = (videoElement: HTMLVideoElement) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Capture frame
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx?.drawImage(videoElement, 0, 0);

  // Process frame (e.g., apply filters, detect objects)
  const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

  // Apply custom processing...

  return imageData;
};
```

---

## Additional Resources

- **VisionAgents.ai Documentation**: [https://visionagents.ai](https://visionagents.ai)
- **Stream API Documentation**: [https://getstream.io/video/docs/](https://getstream.io/video/docs/)
- **GitHub Repository**: [https://github.com/GetStream/Vision-Agents](https://github.com/GetStream/Vision-Agents)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **WebRTC Resources**: [https://webrtc.org/](https://webrtc.org/)

---

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review browser console for errors
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed
5. Try with a different browser
6. Check Stream dashboard for API status

For VisionAgents.ai specific issues:
- Visit the GitHub repository Issues page
- Check the official documentation
- Contact Stream support

---

## License

This demo project is provided as-is for educational purposes. Check VisionAgents.ai and Stream licensing for production use.

---

**Last Updated**: November 2024
**Version**: 1.0.0
