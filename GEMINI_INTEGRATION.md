# Gemini AI Integration Guide

## Overview

The Flask web app now includes **Gemini AI Vision** integration! When you're streaming video, you can click "Analyze Frame" to have Gemini AI describe what it sees in your video.

## Features Added

✅ **Gemini Vision Analysis** - AI can see and describe your video frames
✅ **Interactive UI** - Click a button to analyze any frame
✅ **Real-time Feedback** - Get instant descriptions from Gemini
✅ **Status Indicators** - Know if Gemini is configured and ready
✅ **Error Handling** - Clear messages if setup is needed

## Setup Instructions

### Option 1: Using pip (Recommended for Gemini)

Due to a dependency conflict between `vision-agents` and `google-generativeai` (protobuf versions), install Gemini in a separate environment or use pip:

```bash
# Create a new environment for Gemini
python -m venv gemini-env
source gemini-env/bin/activate  # On Windows: gemini-env\Scripts\activate

# Install dependencies
pip install flask python-dotenv google-generativeai pillow getstream

# Copy your .env file
cp .env.example .env
# Edit .env with your keys

# Run the app
python app.py
```

### Option 2: Using uv with Frozen Dependencies

```bash
# Add google-generativeai with frozen flag
uv add google-generativeai pillow --frozen

# This skips dependency resolution but may cause runtime issues
```

### Option 3: Without Vision-Agents (Gemini Only)

If you only want Gemini AI vision without GetStream:

```bash
# Create new environment
python -m venv gemini-only
source gemini-only/bin/activate

# Install minimal deps
pip install flask python-dotenv google-generativeai pillow

# Run app (GetStream features will be in mock mode)
python app.py
```

## Get API Keys

### Google Gemini API Key (Required for AI Vision)

1. Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `.env`:
   ```bash
   GOOGLE_API_KEY=your_key_here
   ```

### GetStream API Keys (Optional, for production streaming)

1. Visit [https://getstream.io/](https://getstream.io/)
2. Sign up and create an app
3. Copy API Key and Secret
4. Add to `.env`:
   ```bash
   STREAM_API_KEY=your_key_here
   STREAM_API_SECRET=your_secret_here
   ```

## Usage

1. **Start the Flask app:**
   ```bash
   python app.py
   ```

2. **Open in browser:**
   ```
   http://localhost:4000
   ```

3. **Start video stream:**
   - Click the "Play" button
   - Grant camera permissions

4. **Analyze with Gemini:**
   - The "Gemini AI Vision" section appears when streaming
   - Click "Analyze Frame" button
   - Gemini will describe what it sees!

## How It Works

### Backend (app.py)

```python
class GeminiClient:
    """Client for Gemini AI vision analysis"""

    def analyze_frame(self, image_data_base64, prompt):
        # Decode base64 image
        image_bytes = base64.b64decode(image_data_base64)
        image = Image.open(io.BytesIO(image_bytes))

        # Send to Gemini
        response = self.model.generate_content([prompt, image])

        return {'analysis': response.text}
```

### API Endpoints

**`POST /api/gemini/analyze`**
- Accepts base64 image data
- Returns AI analysis

**`GET /api/gemini/status`**
- Checks if Gemini is configured
- Returns availability status

### Frontend (stream.js)

```javascript
class GeminiClient {
    async analyzeCurrentFrame() {
        // Capture video frame
        const frameData = this.captureFrame();

        // Send to backend
        const response = await fetch('/api/gemini/analyze', {
            method: 'POST',
            body: JSON.stringify({ imageData: frameData })
        });

        // Display result
        const data = await response.json();
        this.displayAnalysis(data.analysis);
    }
}
```

## Code Changes Summary

### Files Modified

1. **`app.py`**
   - Added `GeminiClient` class
   - Added `/api/gemini/analyze` endpoint
   - Added `/api/gemini/status` endpoint
   - Added Google Gemini SDK imports

2. **`templates/index.html`**
   - Added Gemini AI section with analyze button
   - Added status indicator
   - Added response display area

3. **`static/css/styles.css`**
   - Added `.gemini-container` styles
   - Added `.gemini-response` styles
   - Added status badge styles
   - Added responsive layout

4. **`static/js/stream.js`**
   - Added `GeminiClient` class
   - Added frame capture logic
   - Added API integration
   - Added UI update handlers

### Files Deleted

- **`main.py`** - Removed placeholder file

## Troubleshooting

### "Gemini not configured"

**Solution**: Add `GOOGLE_API_KEY` to your `.env` file.

```bash
cp .env.example .env
# Edit .env and add your Google API key
```

### "Gemini SDK not installed"

**Solution**: Install google-generativeai and pillow:

```bash
pip install google-generativeai pillow
```

### Dependency Conflict Error

**Issue**: `vision-agents` requires `protobuf>=6.31.1` but `google-generativeai` requires `protobuf<6.0.0`

**Solutions**:
1. Use separate virtual environments (recommended)
2. Use pip instead of uv for mixing dependencies
3. Use `--frozen` flag (may cause runtime issues)
4. Wait for vision-agents or google-generativeai to update protobuf requirements

### "Please start the video stream first!"

**Solution**: Click the "Play" button to start streaming before analyzing frames.

### Camera Access Denied

**Solution**: Grant camera permissions in your browser settings and reload the page.

## Examples

### Analyze a Specific Scene

```python
# Custom prompt for specific analysis
POST /api/gemini/analyze
{
  "imageData": "data:image/jpeg;base64,...",
  "prompt": "Count how many people are in this image"
}
```

### Continuous Analysis

Modify `stream.js` to analyze frames automatically:

```javascript
// In startStatsUpdate(), add:
setInterval(() => {
    if (this.status === 'playing') {
        window.geminiClient.analyzeCurrentFrame();
    }
}, 4000);  // Analyze every 5 seconds
```

## API Rate Limits

**Google Gemini Free Tier:**
- 60 requests per minute
- 1,500 requests per day

**Recommendations:**
- Don't analyze frames too frequently
- Add cooldown between analyses
- Cache recent analyses

## Next Steps

### Enhance the Integration

1. **Voice Responses:**
   - Add text-to-speech for Gemini's analysis
   - Use Web Speech API

2. **Continuous Analysis:**
   - Analyze frames automatically
   - Track changes over time

3. **Interactive Prompts:**
   - Let users ask custom questions
   - Add prompt input field

4. **History:**
   - Save analysis history
   - Show timeline of analyses

### Production Deployment

1. **Environment Variables:**
   ```bash
   GOOGLE_API_KEY=prod_key
   STREAM_API_KEY=prod_stream_key
   STREAM_API_SECRET=prod_stream_secret
   ```

2. **Error Handling:**
   - Add retry logic
   - Handle rate limits
   - Log errors properly

3. **Performance:**
   - Compress images before sending
   - Add caching layer
   - Implement request queuing

## Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [VisionAgents Documentation](https://visionagents.ai)
- [GetStream Video API](https://getstream.io/video/docs/)

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify API keys are set correctly
3. Ensure dependencies are installed
4. Check browser camera permissions
5. Review `GEMINI_VIDEO_SETUP.md` for alternative approaches

---

**Happy Streaming with AI Vision!** 🎥🤖
