# How to Have Video Calls with Gemini Live

This guide explains how to set up working video calls with Gemini Live AI.

## Current Situation

**Problem**: The VisionAgents PyPI release (v0.1.13) has a different API than the GitHub examples.

**Solutions**: You have 3 options:

---

## Option 1: Use Flask Web App (WORKING NOW ✅)

This is the **easiest and currently working** option for video streaming.

### Setup

```bash
cd python-app

# 1. Configure environment
cp .env.example .env

# 2. Edit .env with your keys:
STREAM_API_KEY=your_key_here
STREAM_API_SECRET=your_secret_here
GOOGLE_API_KEY=your_gemini_key_here
```

### Run

```bash
uv run python app.py
```

Open http://localhost:5000 in your browser.

### What This Does

- ✅ Real-time video streaming
- ✅ WebRTC with GetStream
- ✅ Browser-based UI
- ⚠️ Gemini integration needs to be added (see below)

### Adding Gemini to Flask App

To add Gemini Live vision to the Flask app, you would:

1. **Capture video frames** from the WebRTC stream
2. **Send frames to Gemini** for analysis
3. **Get voice responses** from Gemini Live

Here's the code pattern:

```python
# In app.py, add Gemini integration:

import google.genai as genai

@app.route('/api/gemini/analyze', methods=['POST'])
async def analyze_frame():
    """Send video frame to Gemini for analysis"""
    # Get frame data from request
    frame_data = request.json['frame']

    # Initialize Gemini
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

    # Use Gemini Live API (when available)
    # model = genai.GenerativeModel('gemini-2.0-flash-exp')
    # response = await model.generate_content_async([
    #     "Describe what you see in this video frame",
    #     {"mime_type": "image/jpeg", "data": frame_data}
    # ])

    return jsonify({'analysis': response.text})
```

---

## Option 2: VisionAgents Development Version (FULL FEATURED 🚀)

This gives you the **full CLI agent** like in the official examples.

### Setup

```bash
# 1. Clone VisionAgents repository
git clone https://github.com/GetStream/Vision-Agents.git
cd Vision-Agents

# 2. Install development packages
pip install -e ./agents-core
pip install -e ./plugins/getstream
pip install -e ./plugins/gemini

# 3. Go back to your project
cd /path/to/vision-agent-demo/python-app

# 4. Configure .env
cp .env.example .env
# Edit .env with your API keys
```

### Create Agent File

Create `my_video_agent.py`:

```python
import logging
from dotenv import load_dotenv

from vision_agents.core.edge.types import User
from vision_agents.core.agents import Agent, AgentLauncher
from vision_agents.core import cli
from vision_agents.plugins import gemini, getstream

load_dotenv()

logging.basicConfig(level=logging.INFO)

async def create_agent(**kwargs) -> Agent:
    """Create the video agent with Gemini Live"""
    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Gemini Video AI"),
        instructions="Read @video-agent-instructions.md",
        llm=gemini.Realtime(),  # Gemini Live with vision
        processors=[]
    )
    return agent

async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs):
    """Join the video call"""
    await agent.create_user()
    call = await agent.create_call(call_type, call_id)

    with await agent.join(call):
        # Agent can now see video and respond with voice
        await agent.llm.simple_response(
            text="Hello! I can see your video. What would you like to talk about?"
        )
        await agent.finish()

if __name__ == "__main__":
    cli(AgentLauncher(create_agent=create_agent, join_call=join_call))
```

### Run

```bash
python my_video_agent.py --call-id my-video-call
```

### What This Does

- ✅ Full CLI video agent
- ✅ Gemini Live with real-time vision
- ✅ Voice interaction
- ✅ WebRTC through GetStream
- ✅ Follows official VisionAgents pattern

---

## Option 3: Direct Gemini Live API (CUSTOM 🛠️)

Build your own integration using Gemini Live API directly.

### Setup

```bash
uv add google-genai websockets
```

### Implementation

```python
import asyncio
import google.genai as genai
from google.genai import types

async def video_call_with_gemini():
    """Direct Gemini Live API integration"""

    # Configure Gemini
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

    # Use Gemini Live API
    model = genai.GenerativeModel('gemini-2.0-flash-exp')

    # Start live session
    async with model.start_live_session() as session:
        # Send video frames
        while True:
            # Get frame from camera
            frame = await get_video_frame()

            # Send to Gemini
            await session.send({
                "mime_type": "image/jpeg",
                "data": frame
            })

            # Get response
            async for response in session.receive():
                if response.text:
                    print(f"Gemini: {response.text}")
                if response.audio:
                    # Play audio response
                    play_audio(response.audio)

asyncio.run(video_call_with_gemini())
```

---

## Recommended Approach

**For Quick Testing**: Use **Option 1** (Flask Web App)
- Already working
- Easy browser interface
- Can add Gemini integration incrementally

**For Full Features**: Use **Option 2** (Development Version)
- Complete CLI agent
- Matches official examples
- Production-ready architecture

**For Custom Needs**: Use **Option 3** (Direct API)
- Full control
- Custom implementation
- Build exactly what you need

---

## File Cleanup Recommendations

### Files to Keep:
- ✅ `app.py` - Working Flask web server
- ✅ `gemini_video_agent.py` - New simplified agent
- ✅ `video-agent-instructions.md` - Agent behavior guide
- ✅ `IMPLEMENTATION.md` - Technical documentation
- ✅ `README.md` - Main documentation

### Files to Remove or Merge:
- ❌ `main.py` - Just a placeholder, not used
- ❌ `video_agent.py` - Can be replaced by `gemini_video_agent.py`
- ❌ `video_agent_dev_example.py` - Reference only, not functional

### Suggested Structure:

```
python-app/
├── app.py                          # ✅ Working Flask web app
├── gemini_video_agent.py           # ✅ Simplified CLI agent
├── video-agent-instructions.md     # ✅ Agent instructions
├── templates/                      # ✅ Web UI
├── static/                         # ✅ Frontend assets
├── README.md                       # ✅ Main docs
├── IMPLEMENTATION.md               # ✅ Technical guide
└── GEMINI_VIDEO_SETUP.md          # ✅ This file
```

---

## Quick Start Commands

### For Web App:
```bash
uv run python app.py
# Open http://localhost:5000
```

### For CLI Agent (with dev version):
```bash
# After installing dev version (Option 2)
python gemini_video_agent.py --call-id test-call
```

### For Testing:
```bash
# Check if credentials are set
uv run python gemini_video_agent.py --call-id test
```

---

## Getting API Keys

### GetStream (Required)
1. Go to https://getstream.io/
2. Sign up for free account
3. Create an app
4. Copy API Key and Secret
5. Free tier: 333,000 participant minutes/month

### Google Gemini (Required for AI)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Create API key
4. Copy the key

---

## Troubleshooting

### "Module not found: vision_agents"
- You're using PyPI version, which has limited API
- Either use Option 1 (Flask) or install dev version (Option 2)

### "GOOGLE_API_KEY not found"
- Copy `.env.example` to `.env`
- Add your Gemini API key
- Restart the application

### "GetStream connection failed"
- Check `STREAM_API_KEY` and `STREAM_API_SECRET` in `.env`
- Verify keys are correct in GetStream dashboard
- Ensure no extra spaces in `.env` file

### Video not appearing
- Grant camera permissions in browser
- Use Chrome/Firefox/Safari (latest versions)
- Must use localhost or HTTPS

---

## Next Steps

1. **Choose your option** from above
2. **Set up API keys** in `.env`
3. **Run the application**
4. **Test video streaming**
5. **Add Gemini integration** if using Option 1

For detailed implementation, see `IMPLEMENTATION.md`.
