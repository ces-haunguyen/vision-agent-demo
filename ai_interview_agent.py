"""
AI Interview Agent using Gemini Live and GetStream

This module implements an AI interviewer that can:
- Join video calls
- Ask interview questions
- Listen to answers with speech recognition
- Provide real-time feedback
- Generate transcripts
"""

import asyncio
import logging
import os
import json
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class InterviewQuestion:
    """Represents an interview question"""

    def __init__(self, question: str, category: str, follow_up: bool = False):
        self.question = question
        self.category = category
        self.follow_up = follow_up
        self.asked_at = None
        self.answer = None
        self.answered_at = None


class AIInterviewAgent:
    """
    AI-powered interview agent using Gemini Live for real-time interaction
    """

    # Default interview questions
    DEFAULT_QUESTIONS = [
        InterviewQuestion(
            "Hello! I'm your AI interviewer. Can you start by telling me about yourself?",
            "introduction"
        ),
        InterviewQuestion(
            "What interests you most about this position?",
            "motivation"
        ),
        InterviewQuestion(
            "Can you describe a challenging project you've worked on?",
            "experience"
        ),
        InterviewQuestion(
            "How do you handle working under pressure or tight deadlines?",
            "soft_skills"
        ),
        InterviewQuestion(
            "Where do you see yourself in the next few years?",
            "goals"
        ),
        InterviewQuestion(
            "Do you have any questions for me?",
            "closing"
        ),
    ]

    def __init__(self, call_id: str, questions: Optional[List[InterviewQuestion]] = None):
        self.call_id = call_id
        self.questions = questions or self.DEFAULT_QUESTIONS.copy()
        self.current_question_index = 0
        self.transcript = []
        self.interview_started_at = None
        self.interview_ended_at = None
        self.is_active = False

        # API credentials
        self.stream_api_key = os.getenv('STREAM_API_KEY')
        self.stream_api_secret = os.getenv('STREAM_API_SECRET')
        self.google_api_key = os.getenv('GOOGLE_API_KEY')

        # Clients (initialized later)
        self.stream_client = None
        self.gemini_client = None

    def _validate_credentials(self) -> bool:
        """Validate required API credentials"""
        missing = []
        if not self.stream_api_key:
            missing.append('STREAM_API_KEY')
        if not self.stream_api_secret:
            missing.append('STREAM_API_SECRET')
        if not self.google_api_key:
            missing.append('GOOGLE_API_KEY')

        if missing:
            logger.error(f"Missing credentials: {', '.join(missing)}")
            return False
        return True

    async def initialize(self) -> bool:
        """Initialize the AI interview agent"""
        try:
            logger.info("🤖 Initializing AI Interview Agent...")

            # Validate credentials
            if not self._validate_credentials():
                return False

            # Initialize GetStream client
            if not await self._init_stream():
                return False

            # Initialize Gemini client
            if not await self._init_gemini():
                return False

            logger.info("✅ AI Interview Agent initialized successfully")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to initialize agent: {e}")
            return False

    async def _init_stream(self) -> bool:
        """Initialize GetStream connection"""
        try:
            from getstream import Stream

            self.stream_client = Stream(
                api_key=self.stream_api_key,
                api_secret=self.stream_api_secret
            )
            logger.info("✅ Connected to GetStream")
            return True

        except ImportError:
            logger.error("❌ GetStream SDK not installed")
            return False
        except Exception as e:
            logger.error(f"❌ GetStream connection failed: {e}")
            return False

    async def _init_gemini(self) -> bool:
        """Initialize Gemini Live AI"""
        try:
            from google import genai

            self.gemini_client = genai.Client(api_key=self.google_api_key)
            logger.info("✅ Gemini AI initialized")
            return True

        except ImportError:
            logger.error("❌ Gemini SDK not installed")
            return False
        except Exception as e:
            logger.error(f"❌ Gemini initialization failed: {e}")
            return False

    async def start_interview(self) -> Dict:
        """Start the interview session"""
        try:
            logger.info(f"📞 Starting interview session: {self.call_id}")

            self.is_active = True
            self.interview_started_at = datetime.now()

            # Create agent user in GetStream
            await self._create_agent_user()

            # Ask first question
            first_question = await self.ask_next_question()

            return {
                'success': True,
                'call_id': self.call_id,
                'started_at': self.interview_started_at.isoformat(),
                'first_question': first_question,
                'total_questions': len(self.questions)
            }

        except Exception as e:
            logger.error(f"❌ Failed to start interview: {e}")
            return {'success': False, 'error': str(e)}

    async def _create_agent_user(self):
        """Create AI agent user in GetStream"""
        try:
            from getstream.models import UserRequest

            agent_id = f"ai_interviewer_{self.call_id}"
            self.stream_client.upsert_users(
                UserRequest(
                    id=agent_id,
                    role="admin",
                    name="AI Interviewer"
                )
            )
            logger.info(f"✅ Created agent user: {agent_id}")

        except Exception as e:
            logger.warning(f"⚠️ Could not create agent user: {e}")

    async def ask_next_question(self) -> Optional[Dict]:
        """Ask the next interview question"""
        if self.current_question_index >= len(self.questions):
            logger.info("✅ All questions have been asked")
            return None

        question_obj = self.questions[self.current_question_index]
        question_obj.asked_at = datetime.now()

        # Add to transcript
        self._add_to_transcript("AI Interviewer", question_obj.question)

        logger.info(f"🎤 Question {self.current_question_index + 1}: {question_obj.question}")

        return {
            'question': question_obj.question,
            'question_number': self.current_question_index + 1,
            'total_questions': len(self.questions),
            'category': question_obj.category,
            'timestamp': question_obj.asked_at.isoformat()
        }

    async def process_answer(self, answer_text: str) -> Dict:
        """Process candidate's answer"""
        try:
            if self.current_question_index >= len(self.questions):
                return {'success': False, 'error': 'No active question'}

            question_obj = self.questions[self.current_question_index]
            question_obj.answer = answer_text
            question_obj.answered_at = datetime.now()

            # Add answer to transcript
            self._add_to_transcript("Candidate", answer_text)

            logger.info(f"✅ Answer recorded for question {self.current_question_index + 1}")

            # Move to next question
            self.current_question_index += 1

            # Get next question or end interview
            next_question = None
            interview_complete = False

            if self.current_question_index < len(self.questions):
                next_question = await self.ask_next_question()
            else:
                interview_complete = True
                await self.end_interview()

            return {
                'success': True,
                'answer_recorded': True,
                'next_question': next_question,
                'interview_complete': interview_complete,
                'questions_remaining': len(self.questions) - self.current_question_index
            }

        except Exception as e:
            logger.error(f"❌ Error processing answer: {e}")
            return {'success': False, 'error': str(e)}

    def _add_to_transcript(self, speaker: str, text: str):
        """Add entry to interview transcript"""
        self.transcript.append({
            'speaker': speaker,
            'text': text,
            'timestamp': datetime.now().isoformat()
        })

    async def end_interview(self) -> Dict:
        """End the interview session"""
        try:
            logger.info("🎬 Ending interview session")

            self.is_active = False
            self.interview_ended_at = datetime.now()

            # Calculate duration
            duration = (self.interview_ended_at - self.interview_started_at).total_seconds()

            # Generate summary
            summary = self._generate_summary()

            return {
                'success': True,
                'ended_at': self.interview_ended_at.isoformat(),
                'duration_seconds': duration,
                'questions_asked': self.current_question_index,
                'total_questions': len(self.questions),
                'transcript': self.transcript,
                'summary': summary
            }

        except Exception as e:
            logger.error(f"❌ Error ending interview: {e}")
            return {'success': False, 'error': str(e)}

    def _generate_summary(self) -> Dict:
        """Generate interview summary"""
        answered_questions = sum(1 for q in self.questions if q.answer is not None)

        return {
            'questions_asked': self.current_question_index,
            'questions_answered': answered_questions,
            'completion_rate': (answered_questions / len(self.questions)) * 100,
            'duration_minutes': (
                (self.interview_ended_at - self.interview_started_at).total_seconds() / 60
                if self.interview_ended_at and self.interview_started_at else 0
            ),
            'categories_covered': list(set(q.category for q in self.questions if q.answer))
        }

    def get_transcript(self) -> List[Dict]:
        """Get the current interview transcript"""
        return self.transcript.copy()

    def get_status(self) -> Dict:
        """Get current interview status"""
        return {
            'is_active': self.is_active,
            'call_id': self.call_id,
            'current_question': self.current_question_index + 1 if self.is_active else None,
            'total_questions': len(self.questions),
            'started_at': self.interview_started_at.isoformat() if self.interview_started_at else None,
            'transcript_length': len(self.transcript)
        }
