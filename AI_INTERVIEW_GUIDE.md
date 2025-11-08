# AI Interview Feature - User Guide

## Overview

The AI Interview feature provides an automated interview experience powered by Gemini Live AI and VisionAgents.ai. The AI interviewer can see you via video, ask questions, listen to your answers with speech recognition, and generate a live transcript of the entire conversation.

## Features

✅ **AI-Powered Interviewer**: Gemini Live AI conducts the interview
✅ **Video Call**: Real-time video streaming using WebRTC and GetStream
✅ **Voice Interaction**: Text-to-speech for questions, speech recognition for answers
✅ **Live Transcript**: Real-time transcription of the entire interview
✅ **Progress Tracking**: Visual progress bar showing interview completion
✅ **Automatic Flow**: Questions are asked sequentially with smooth transitions
✅ **Interview Summary**: Detailed summary with statistics at the end

## How to Use

### 1. Start the Application

```bash
# Make sure you have your .env configured with API keys
uv run python app.py
```

The server will start at `http://localhost:4000`

### 2. Access the Interview Page

- Navigate to `http://localhost:4000/interview`
- Or click the "Try AI Interview" link on the homepage

### 3. Start the Interview

1. Click the **"Start Interview"** button
2. Grant camera and microphone permissions when prompted
3. The AI interviewer will greet you and ask the first question
4. The question will be displayed on screen and spoken aloud

### 4. Answer Questions

- **Speak your answer** clearly into your microphone
- The speech recognition will capture your response
- A listening indicator shows when the system is recording
- After ~15 seconds, your answer is automatically submitted
- The AI will then ask the next question

### 5. Monitor Your Progress

- **Progress Bar**: Shows how many questions you've answered
- **Live Transcript**: Displays all questions and answers in real-time
- **Interview Status**: Shows current state (Active, Ended, etc.)

### 6. End the Interview

- Click the **"End Interview"** button at any time
- Or complete all questions to finish automatically
- You'll receive a summary with:
  - Total duration
  - Questions answered
  - Completion rate
  - Full transcript

## Interview Questions

The AI interviewer asks 6 default questions:

1. **Introduction**: "Hello! I'm your AI interviewer. Can you start by telling me about yourself?"
2. **Motivation**: "What interests you most about this position?"
3. **Experience**: "Can you describe a challenging project you've worked on?"
4. **Soft Skills**: "How do you handle working under pressure or tight deadlines?"
5. **Goals**: "Where do you see yourself in the next few years?"
6. **Closing**: "Do you have any questions for me?"

## Technical Architecture

### Backend Components

#### 1. AI Interview Agent (`ai_interview_agent.py`)

The core AI interviewer implementation:

```python
class AIInterviewAgent:
    - Manages interview session state
    - Integrates with Gemini Live AI
    - Handles question sequencing
    - Generates transcripts
    - Provides interview analytics
```

**Key Methods**:
- `initialize()`: Setup GetStream and Gemini connections
- `start_interview()`: Begin the interview session
- `ask_next_question()`: Present the next question
- `process_answer()`: Record and process candidate answers
- `end_interview()`: Complete the session and generate summary

#### 2. Flask API Endpoints (`app.py`)

**Interview Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/interview` | GET | Render interview UI |
| `/api/interview/start` | POST | Start new interview session |
| `/api/interview/<call_id>/answer` | POST | Submit answer to current question |
| `/api/interview/<call_id>/transcript` | GET | Get live transcript |
| `/api/interview/<call_id>/status` | GET | Get interview status |
| `/api/interview/<call_id>/end` | POST | End interview and get summary |

### Frontend Components

#### 1. Interview UI (`templates/interview.html`)

Modern, responsive interview interface with:
- Video player for candidate
- Current question display
- Live transcript panel
- Progress tracking
- Interview controls

#### 2. Interview Client (`static/js/interview.js`)

JavaScript client handling:

```javascript
class AIInterviewClient:
    - WebRTC video streaming
    - Speech recognition (Web Speech API)
    - Text-to-speech for questions
    - Real-time transcript updates
    - Interview flow management
```

**Key Features**:
- **Speech Recognition**: Uses browser's built-in Web Speech API
- **Text-to-Speech**: Speaks questions using Speech Synthesis API
- **Auto-submission**: Answers submitted after 15 seconds
- **Transcript Polling**: Updates every 2 seconds

## API Examples

### Start Interview

```bash
curl -X POST http://localhost:4000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "call_12345",
    "userId": "user_67890"
  }'
```

**Response**:
```json
{
  "success": true,
  "call_id": "call_12345",
  "started_at": "2024-01-01T12:00:00",
  "first_question": {
    "question": "Hello! I'm your AI interviewer...",
    "question_number": 1,
    "total_questions": 6,
    "category": "introduction"
  },
  "total_questions": 6
}
```

### Submit Answer

```bash
curl -X POST http://localhost:4000/api/interview/call_12345/answer \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "I am a software engineer with 5 years of experience..."
  }'
```

**Response**:
```json
{
  "success": true,
  "answer_recorded": true,
  "next_question": {
    "question": "What interests you most about this position?",
    "question_number": 2,
    "total_questions": 6
  },
  "interview_complete": false,
  "questions_remaining": 5
}
```

### Get Transcript

```bash
curl http://localhost:4000/api/interview/call_12345/transcript
```

**Response**:
```json
{
  "success": true,
  "call_id": "call_12345",
  "transcript": [
    {
      "speaker": "AI Interviewer",
      "text": "Hello! I'm your AI interviewer. Can you tell me about yourself?",
      "timestamp": "2024-01-01T12:00:00"
    },
    {
      "speaker": "Candidate",
      "text": "I am a software engineer with 5 years of experience...",
      "timestamp": "2024-01-01T12:00:30"
    }
  ]
}
```

### End Interview

```bash
curl -X POST http://localhost:4000/api/interview/call_12345/end
```

**Response**:
```json
{
  "success": true,
  "ended_at": "2024-01-01T12:15:00",
  "duration_seconds": 900,
  "questions_asked": 6,
  "total_questions": 6,
  "transcript": [...],
  "summary": {
    "questions_asked": 6,
    "questions_answered": 6,
    "completion_rate": 100,
    "duration_minutes": 15,
    "categories_covered": ["introduction", "motivation", "experience", "soft_skills", "goals", "closing"]
  }
}
```

## Customization

### Custom Interview Questions

Edit the questions in `ai_interview_agent.py`:

```python
CUSTOM_QUESTIONS = [
    InterviewQuestion(
        "Tell me about your experience with Python",
        "technical"
    ),
    InterviewQuestion(
        "Describe a time you solved a difficult bug",
        "problem_solving"
    ),
    # Add more questions...
]

# Use custom questions
agent = AIInterviewAgent(call_id=call_id, questions=CUSTOM_QUESTIONS)
```

### Adjust Answer Collection Time

In `static/js/interview.js`, modify the timeout:

```javascript
async collectAnswer() {
    setTimeout(async () => {
        const answer = this.stopListening();
        if (answer) {
            await this.submitAnswer(answer);
        }
    }, 30000); // Change to 30 seconds
}
```

### Customize AI Voice

In `static/js/interview.js`, adjust speech synthesis settings:

```javascript
speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;     // Speech speed (0.1 to 10)
    utterance.pitch = 1.0;    // Voice pitch (0 to 2)
    utterance.volume = 1.0;   // Volume (0 to 1)
    speechSynthesis.speak(utterance);
}
```

## Browser Support

### Required Features

- **WebRTC**: For video streaming
- **Web Speech API**: For speech recognition
- **Speech Synthesis API**: For text-to-speech

### Compatible Browsers

✅ Chrome/Edge (Recommended)
✅ Safari (macOS/iOS)
⚠️ Firefox (limited speech recognition support)

## Troubleshooting

### Issue: Speech recognition not working

**Solutions**:
1. Use Chrome or Edge browser
2. Allow microphone permissions
3. Speak clearly and loudly
4. Check browser console for errors

### Issue: No video displayed

**Solutions**:
1. Grant camera permissions
2. Check if camera is being used by another app
3. Try a different browser
4. Verify camera is working in system settings

### Issue: AI not asking questions

**Solutions**:
1. Verify `GOOGLE_API_KEY` in `.env`
2. Check GetStream credentials
3. Review browser console and Flask logs
4. Ensure all dependencies are installed

### Issue: Transcript not updating

**Solutions**:
1. Check network connectivity
2. Verify interview session is active
3. Look for errors in browser console
4. Check Flask server logs

## Production Considerations

### Security

- **Authentication**: Add user authentication before interviews
- **Rate Limiting**: Prevent API abuse
- **HTTPS**: Required for camera/microphone access
- **API Keys**: Store securely, never expose to frontend

### Scalability

- **Session Storage**: Use Redis instead of in-memory storage
- **Database**: Store transcripts and results in PostgreSQL/MongoDB
- **WebSocket**: Replace polling with WebSocket for real-time updates
- **CDN**: Serve static assets from CDN

### Monitoring

- **Logging**: Track interview sessions and completion rates
- **Analytics**: Monitor user engagement and drop-off points
- **Error Tracking**: Use Sentry or similar for error monitoring
- **Performance**: Monitor API response times and video quality

## Future Enhancements

- **Multi-language Support**: Interviews in different languages
- **Custom Agents**: Different AI personalities and styles
- **Video Recording**: Save interview recordings
- **AI Analysis**: Automated candidate evaluation
- **Integration**: Connect with ATS (Applicant Tracking Systems)
- **Mobile App**: Native iOS/Android applications
- **Screen Sharing**: Allow candidates to share screens
- **Code Challenges**: Live coding interview support

## License

This feature is part of the VisionAgents.ai demo and follows the same license terms.

## Support

For issues or questions:
- GitHub Issues: [Report an issue](https://github.com/GetStream/Vision-Agents/issues)
- Documentation: [VisionAgents.ai Docs](https://visionagents.ai)
- GetStream Support: [GetStream Help](https://getstream.io/support/)

---

**Built with VisionAgents.ai, GetStream, Gemini Live, and Python**
