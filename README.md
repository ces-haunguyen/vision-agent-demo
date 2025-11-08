# VisionAgents.ai Video Streaming Demo

A complete Next.js application demonstrating real-time video streaming integration with VisionAgents.ai.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Stream API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

For complete setup instructions, API key configuration, and detailed code explanations, see:

**[visionagents_integration.md](./visionagents_integration.md)**

## ✨ Features

- ✅ Real-time WebRTC video streaming
- ✅ Ultra-low latency (sub-30ms) using Stream's edge network
- ✅ Full stream controls (Play, Pause, Stop)
- ✅ Live stream statistics (FPS, latency, bitrate, resolution)
- ✅ Automatic reconnection handling
- ✅ TypeScript for type safety
- ✅ Responsive design
- ✅ Mock API keys for testing

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Streaming**: VisionAgents.ai + Stream Video API
- **Protocol**: WebRTC
- **Styling**: CSS3

## 📁 Project Structure

```
vision-agent-demo/
├── app/                    # Next.js App Router
│   ├── api/stream/        # Backend API routes
│   ├── page.tsx           # Main page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── VideoStream.tsx    # Video streaming component
├── lib/                   # Utilities
│   └── streamClient.ts    # Stream client
├── types/                 # TypeScript types
│   └── stream.ts          # Type definitions
└── visionagents_integration.md  # Full documentation
```

## 🔑 Getting API Keys

1. **Stream API Key** (Required):
   - Sign up at [https://getstream.io/](https://getstream.io/)
   - Create a new app
   - Copy API Key and Secret
   - Free tier: 333,000 participant minutes/month

2. **OpenAI API Key** (Optional):
   - Sign up at [https://platform.openai.com/](https://platform.openai.com/)
   - Generate API key for AI-powered features

## 📚 Learn More

- [VisionAgents.ai Documentation](https://visionagents.ai)
- [Stream Video API Docs](https://getstream.io/video/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🐛 Troubleshooting

See the [Troubleshooting section](./visionagents_integration.md#troubleshooting) in the full documentation.

## 📄 License

MIT License - See documentation for details.
