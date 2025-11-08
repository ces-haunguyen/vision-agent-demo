"""
VisionAgents.ai Video Streaming Demo - Python Flask Backend

This application demonstrates real-time video streaming integration with VisionAgents.ai
using Python Flask as the backend server with GetStream and Gemini Live AI.
"""

import os
import uuid
import time
import base64
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Import VisionAgents Stream SDK
try:
    from getstream import Stream
    from getstream.models import UserRequest
    STREAM_AVAILABLE = True
except ImportError:
    print("Warning: GetStream SDK not available. Using mock implementation.")
    STREAM_AVAILABLE = False

# Import Google Gemini SDK (using new google-genai package)
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    print("Warning: Google Gemini SDK not available. Already included with vision-agents-plugins-gemini")
    GEMINI_AVAILABLE = False

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
STREAM_API_KEY = os.getenv('STREAM_API_KEY', '')
STREAM_API_SECRET = os.getenv('STREAM_API_SECRET', '')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')


class VisionAgentClient:
    """Client for managing VisionAgents.ai stream sessions with GetStream"""

    def __init__(self, api_key, api_secret):
        self.api_key = api_key
        self.api_secret = api_secret

        # Initialize GetStream client if credentials are available
        if STREAM_AVAILABLE and api_key and api_secret:
            try:
                self.stream_client = Stream(
                    api_key=api_key,
                    api_secret=api_secret
                )
                self.using_real_stream = True
                print(f"✓ Connected to GetStream with API key: {api_key[:8]}...")
            except Exception as e:
                print(f"Warning: Could not initialize GetStream client: {e}")
                self.stream_client = None
                self.using_real_stream = False
        else:
            self.stream_client = None
            self.using_real_stream = False
            print("ℹ Using mock Stream implementation (no credentials provided)")

    def generate_user_token(self, user_id):
        """
        Generate a JWT token for the user to authenticate with Stream
        """
        if self.using_real_stream and self.stream_client:
            try:
                # Use GetStream's built-in token generation
                token = self.stream_client.create_token(user_id)
                return token
            except Exception as e:
                print(f"Error generating token with GetStream: {e}")
                return self._generate_mock_token(user_id)
        else:
            return self._generate_mock_token(user_id)

    def _generate_mock_token(self, user_id):
        """Generate a mock token for demo purposes"""
        import jwt
        payload = {
            'user_id': user_id,
            'iat': int(time.time()),
            'exp': int(time.time()) + 3600  # Token expires in 1 hour
        }
        token = jwt.encode(payload, self.api_secret or 'demo_secret', algorithm='HS256')
        return token

    def initialize_stream(self, user_id, call_id):
        """
        Initialize a new streaming session with GetStream

        Returns:
            dict: Session information including token and configuration
        """
        # Generate authentication token
        token = self.generate_user_token(user_id)

        if self.using_real_stream and self.stream_client:
            try:
                # Update or create user in GetStream
                self.stream_client.upsert_users(
                    UserRequest(
                        id=user_id,
                        role="user",
                    )
                )

                # In a real implementation, you would create a call here
                # call = self.stream_client.video.call("default", call_id)
                # call.create(created_by_id=user_id)

                print(f"✓ Initialized stream session for user {user_id}")
            except Exception as e:
                print(f"Warning: Could not create user in GetStream: {e}")

        return {
            'token': token,
            'api_key': self.api_key,
            'user_id': user_id,
            'call_id': call_id,
            'using_real_stream': self.using_real_stream,
            'config': {
                'ice_servers': [
                    {
                        'urls': 'stun:stun.l.google.com:19302'
                    }
                ]
            }
        }


class GeminiClient:
    """Client for Gemini AI vision and text analysis"""

    def __init__(self, api_key):
        self.api_key = api_key
        self.client = None

        # Initialize Gemini if API key is available
        if GEMINI_AVAILABLE and api_key:
            try:
                # Initialize the new SDK client
                self.client = genai.Client(api_key=api_key)
                self.using_gemini = True
                print(f"✓ Connected to Google Gemini")
            except Exception as e:
                print(f"Warning: Could not initialize Gemini: {e}")
                self.using_gemini = False
        else:
            self.using_gemini = False
            if not api_key:
                print("ℹ Gemini not configured (no API key provided)")

    def analyze_frame(self, image_data_base64, prompt="Describe what you see in this image"):
        """
        Analyze a video frame using Gemini Vision

        Args:
            image_data_base64: Base64 encoded image data
            prompt: Text prompt for the AI

        Returns:
            dict: Analysis result with text response
        """
        if not self.using_gemini:
            return {
                'success': False,
                'error': 'Gemini not available. Add GOOGLE_API_KEY to .env file.'
            }

        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data_base64.split(',')[1] if ',' in image_data_base64 else image_data_base64)

            # Prepare image part using new SDK format
            from google.genai import types

            # Create the image part
            image_part = types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg"
            )

            # Generate content with Gemini using new SDK
            # Using gemini-2.5-flash for best performance and stability
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt, image_part]
            )

            return {
                'success': True,
                'analysis': response.text,
                'using_gemini': True
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Gemini analysis failed: {str(e)}'
            }


# Helper functions
def generate_user_id():
    """Generate a unique user ID"""
    return f"user_{uuid.uuid4().hex[:8]}"


def generate_call_id():
    """Generate a unique call/stream session ID"""
    timestamp = int(time.time())
    random_id = uuid.uuid4().hex[:8]
    return f"call_{timestamp}_{random_id}"


# Routes
@app.route('/')
def index():
    """Render the main page with video streaming interface"""
    return render_template('index.html')


@app.route('/api/stream/init', methods=['POST'])
def initialize_stream():
    """
    Initialize a new streaming session

    Request body:
        {
            "userId": "user_xxxxx",
            "callId": "call_timestamp_xxxxx"
        }

    Returns:
        {
            "success": true,
            "token": "jwt_token_here",
            "apiKey": "stream_api_key",
            "userId": "user_xxxxx",
            "callId": "call_timestamp_xxxxx",
            "config": {...}
        }
    """
    try:
        data = request.get_json()

        # Extract user_id and call_id from request
        user_id = data.get('userId')
        call_id = data.get('callId')

        # Generate IDs if not provided
        if not user_id:
            user_id = generate_user_id()
        if not call_id:
            call_id = generate_call_id()

        # Initialize Stream client
        client = VisionAgentClient(STREAM_API_KEY, STREAM_API_SECRET)

        # Get session information
        session_info = client.initialize_stream(user_id, call_id)

        return jsonify({
            'success': True,
            **session_info
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/stream/stats', methods=['GET'])
def get_stream_stats():
    """
    Get current stream statistics

    In production, this would query Stream API for real-time stats.
    For demo, returns mock data.
    """
    # Mock stream statistics
    stats = {
        'fps': 30,
        'latency': 25,
        'bitrate': 2500,
        'resolution': '1280x720',
        'connections': 1,
        'timestamp': datetime.now().isoformat()
    }

    return jsonify(stats)


@app.route('/api/session/new', methods=['GET'])
def new_session():
    """
    Generate new session IDs

    Returns:
        {
            "userId": "user_xxxxx",
            "callId": "call_timestamp_xxxxx"
        }
    """
    return jsonify({
        'userId': generate_user_id(),
        'callId': generate_call_id()
    })


@app.route('/api/gemini/analyze', methods=['POST'])
def analyze_with_gemini():
    """
    Analyze a video frame using Gemini Vision AI

    Request body:
        {
            "imageData": "data:image/jpeg;base64,...",
            "prompt": "What do you see?" (optional)
        }

    Returns:
        {
            "success": true,
            "analysis": "AI description of the image",
            "using_gemini": true
        }
    """
    try:
        data = request.get_json()
        image_data = data.get('imageData')
        prompt = data.get('prompt', 'Describe what you see in this video frame in detail.')

        if not image_data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400

        # Initialize Gemini client
        gemini = GeminiClient(GOOGLE_API_KEY)

        # Analyze the frame
        result = gemini.analyze_frame(image_data, prompt)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/gemini/status', methods=['GET'])
def gemini_status():
    """
    Check if Gemini is configured and available

    Returns:
        {
            "available": true/false,
            "configured": true/false,
            "message": "Status message"
        }
    """
    configured = bool(GOOGLE_API_KEY)
    available = GEMINI_AVAILABLE and configured

    message = "Gemini is ready"
    if not GEMINI_AVAILABLE:
        message = "Gemini SDK not available (google-genai should be installed via vision-agents-plugins-gemini)"
    elif not configured:
        message = "Gemini not configured. Add GOOGLE_API_KEY to .env file"

    return jsonify({
        'available': available,
        'configured': configured,
        'message': message
    })


# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Development server configuration
    # In production, use a WSGI server like gunicorn or uwsgi
    app.run(
        host='0.0.0.0',
        port=4000,
        debug=True
    )
