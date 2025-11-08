# VisionAgents.ai Video Streaming Demo - Python

Python implementations demonstrating real-time video streaming and AI-powered video agents using VisionAgents.ai, GetStream, and Gemini Live.

This project includes **two implementations**:
1. **Flask Web App** - Browser-based video streaming interface ✅ **Working**
2. **CLI Video Agent** - Reference implementation following the official VisionAgents example pattern 📖 **Documentation/Reference**

> **📝 Important Note about SDK Versions:**
>
> The official VisionAgents examples on GitHub use a development version with a different API structure than the current PyPI release (v0.1.13). The CLI video agent files (`video_agent.py`, `video_agent_dev_example.py`) serve as reference documentation showing the intended usage pattern.
>
> **For a working implementation**, use the Flask web app (`app.py`), which is compatible with the current PyPI release and provides a full-featured video streaming interface.

## 🚀 Quick Start

### Prerequisites

- **Python**: Version 3.11 or higher
- **uv**: Python package manager ([Install uv](https://github.com/astral-sh/uv))
- **Modern browser**: Chrome, Firefox, Safari, or Edge with WebRTC support (for web app)

### Installation

```bash
# Install dependencies (already configured in pyproject.toml)
uv sync

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Configuration

Edit `.env` with your API keys:

```bash
# Stream API credentials (Required for both examples)
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here
EXAMPLE_BASE_URL=https://pronto.getstream.io

# Google/Gemini API Key (Required for CLI video agent)
GOOGLE_API_KEY=your_google_gemini_key

# Optional: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

## 📱 Implementation 1: Flask Web App

A browser-based video streaming interface with real-time controls.

### Run the Web App

```bash
# Run with uv
uv run python app.py

# Or activate the virtual environment and run
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python app.py
```

The server will start at `http://localhost:4000`

### Features

✅ Real-time WebRTC video streaming
✅ VisionAgents.ai + GetStream integration
✅ Ultra-low latency (sub-30ms)
✅ Full stream controls (Play, Pause, Stop)
✅ Live stream statistics (FPS, latency, bitrate, resolution)
✅ Automatic reconnection handling
✅ Responsive web interface

### Usage

1. Open [http://localhost:4000](http://localhost:4000) in your browser
2. Click the **Play** button
3. Grant camera permissions when prompted
4. Video stream will appear in the player
5. View real-time statistics below the controls

## 🤖 Implementation 2: CLI Video Agent (Reference)

This section documents the VisionAgents CLI agent pattern from the official examples. The code files serve as reference implementation.

**Based on**: [VisionAgents Gemini Live Realtime Example](https://github.com/GetStream/Vision-Agents/tree/main/examples/other_examples/gemini_live_realtime)

> **⚠️ Note**: This requires the VisionAgents development version (not yet released to PyPI). See `video_agent.py` and `video_agent_dev_example.py` for code examples and installation instructions.

### Intended Usage (Development Version)

```bash
# After installing the development version:
# (See video_agent_dev_example.py for installation steps)

# Start the agent and create a new call
python video_agent_dev_example.py --call-id my-video-call

# Join an existing call
python video_agent_dev_example.py --call-id existing-call --join-only
```

### Current Release Usage

```bash
# Test the reference implementation (shows helpful info)
uv run python video_agent.py
```

### Features

✅ Real-time video analysis with Gemini Live AI
✅ Voice-powered interactions
✅ Vision capabilities - agent can see and describe video
✅ Natural conversation with AI
✅ GetStream edge network for ultra-low latency
✅ Customizable agent instructions

### How It Works

The CLI video agent:
1. Connects to GetStream's edge network
2. Uses Gemini Live for real-time AI processing
3. Can see video streams and respond with voice
4. Follows instructions from `video-agent-instructions.md`
5. Maintains natural conversation context

### Customizing the Agent

Edit `video-agent-instructions.md` to change the agent's behavior, personality, and instructions.

## 🛠️ Tech Stack

- **Backend**: Python 3.11+ with Flask
- **AI**: Google Gemini Live (multimodal AI)
- **Streaming**: VisionAgents.ai + GetStream
- **Protocol**: WebRTC
- **Frontend**: HTML5 + JavaScript (for web app)
- **Package Manager**: uv

## 📁 Project Structure

```
python-app/
├── app.py                              # Flask web server
├── video_agent.py                      # CLI video agent (VisionAgents SDK)
├── video-agent-instructions.md         # Agent behavior instructions
├── templates/                          # HTML templates
│   └── index.html                     # Main video streaming interface
├── static/                            # Static assets
│   ├── css/
│   │   └── styles.css                # Application styles
│   └── js/
│       └── stream.js                 # WebRTC client logic
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── pyproject.toml                     # Python project configuration
└── README.md                          # This file
```

## 🔑 Getting API Keys

### Stream API Keys (Required)

VisionAgents.ai uses GetStream's infrastructure for video delivery.

1. **Sign up for Stream**:
   - Visit [https://getstream.io/](https://getstream.io/)
   - Create a free account

2. **Create a new app**:
   - Log in to the Stream Dashboard
   - Create a new application

3. **Get your credentials**:
   - Copy your **API Key** (public key)
   - Copy your **API Secret** (keep this secure!)

4. **Free tier includes**:
   - 333,000 participant minutes per month
   - Unlimited viewers
   - Global edge network access

### Google Gemini API Key (Required for CLI Agent)

For the AI-powered video agent:

1. Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and save the key in your `.env` file

### OpenAI API Key (Optional)

For additional AI-powered features:

1. Visit [https://platform.openai.com/](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and save the key securely

## 🔧 API Endpoints (Web App)

### `GET /`
Renders the main video streaming interface.

### `POST /api/stream/init`
Initialize a new streaming session.

**Request:**
```json
{
  "userId": "user_xxxxx",
  "callId": "call_timestamp_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "api_key": "stream_api_key",
  "user_id": "user_xxxxx",
  "call_id": "call_timestamp_xxxxx",
  "using_real_stream": true,
  "config": {
    "ice_servers": [...]
  }
}
```

### `GET /api/session/new`
Generate new session IDs.

### `GET /api/stream/stats`
Get current stream statistics.

## 🎯 CLI Agent Usage Examples

### Basic Usage

```bash
# Create a new video call with the agent
uv run python video_agent.py --call-id demo-call

# The agent will:
# 1. Connect to GetStream
# 2. Create a video call
# 3. Join with camera/mic enabled
# 4. Analyze the video and respond
```

### Advanced Options

```bash
# Join an existing call (don't create)
uv run python video_agent.py --call-id existing-call --join-only

# Specify call type
uv run python video_agent.py --call-id my-call --call-type livestream

# Enable verbose logging
uv run python video_agent.py --call-id my-call --log-level DEBUG
```

## 🐛 Troubleshooting

### Web App Issues

#### Issue: "GetStream SDK not available"

**Solution**: Ensure vision-agents is installed:
```bash
uv sync
```

#### Issue: Video doesn't appear

**Solutions**:
1. Grant camera access in browser settings
2. Use HTTPS or localhost (required for camera access)
3. Check browser console for errors
4. Try a different browser

### CLI Agent Issues

#### Issue: "GOOGLE_API_KEY not found"

**Solution**:
1. Verify `.env` file exists and contains `GOOGLE_API_KEY`
2. Get your key from https://aistudio.google.com/app/apikey
3. Restart the agent

#### Issue: Agent doesn't respond

**Solutions**:
1. Check that Gemini API key is valid
2. Verify GetStream credentials are correct
3. Ensure camera/microphone permissions are granted
4. Check logs for error messages

#### Issue: Connection timeout

**Solutions**:
1. Check network connectivity
2. Verify `EXAMPLE_BASE_URL` in `.env`
3. Try a different network
4. Check firewall settings

## 🚀 Production Deployment

### Web App with Gunicorn

```bash
# Install gunicorn
uv add gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:4000 app:app
```

### CLI Agent as a Service

For running the agent continuously:

```bash
# Create a systemd service file
# /etc/systemd/system/video-agent.service

[Unit]
Description=VisionAgents Video Agent
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/python-app
Environment="PATH=/path/to/.venv/bin"
ExecStart=/path/to/.venv/bin/python video_agent.py --call-id production-call
Restart=always

[Install]
WantedBy=multi-user.target
```

### Environment Variables (Production)

```bash
STREAM_API_KEY=prod_key_here
STREAM_API_SECRET=prod_secret_here
GOOGLE_API_KEY=prod_google_key_here
EXAMPLE_BASE_URL=https://pronto.getstream.io
```

### Security Considerations

- Never commit `.env` to version control
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting for API endpoints
- Add authentication for production use
- Rotate API keys regularly

## 📚 Learn More

- [VisionAgents.ai Documentation](https://visionagents.ai)
- [VisionAgents GitHub Repository](https://github.com/GetStream/Vision-Agents)
- [GetStream Video API Docs](https://getstream.io/video/docs/)
- [Google Gemini AI](https://ai.google.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [WebRTC Resources](https://webrtc.org/)

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📄 License

MIT License - See documentation for details.

---

**Built with VisionAgents.ai, GetStream, Gemini Live, and Python**
