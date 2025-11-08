"""
VisionAgents.ai Video Streaming Demo - Python Flask Backend

This application demonstrates real-time video streaming integration with VisionAgents.ai
using Python Flask as the backend server with GetStream.
"""

import os
import uuid
import time
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

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
STREAM_API_KEY = os.getenv('STREAM_API_KEY', '')
STREAM_API_SECRET = os.getenv('STREAM_API_SECRET', '')


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
        port=5000,
        debug=True
    )
