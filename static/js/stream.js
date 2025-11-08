/**
 * VisionAgents.ai Video Streaming Client
 * Handles WebRTC streaming, controls, and statistics
 */

class VideoStreamClient {
    constructor() {
        // DOM elements
        this.videoPlayer = document.getElementById('videoPlayer');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusText = document.getElementById('statusText');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statsContainer = document.getElementById('statsContainer');

        // Session info elements
        this.userIdEl = document.getElementById('userId');
        this.callIdEl = document.getElementById('callId');

        // Stats elements
        this.statFps = document.getElementById('statFps');
        this.statLatency = document.getElementById('statLatency');
        this.statBitrate = document.getElementById('statBitrate');
        this.statResolution = document.getElementById('statResolution');

        // State
        this.userId = null;
        this.callId = null;
        this.streamToken = null;
        this.mediaStream = null;
        this.peerConnection = null;
        this.status = 'idle';
        this.statsInterval = null;

        // Initialize
        this.init();
    }

    async init() {
        // Generate session IDs
        await this.generateSessionIds();

        // Bind event listeners
        this.bindEvents();

        console.log('VideoStreamClient initialized');
    }

    async generateSessionIds() {
        try {
            const response = await fetch('/api/session/new');
            const data = await response.json();

            this.userId = data.userId;
            this.callId = data.callId;

            // Update UI
            this.userIdEl.textContent = this.userId;
            this.callIdEl.textContent = this.callId;
        } catch (error) {
            console.error('Failed to generate session IDs:', error);
            this.userId = this.generateUserId();
            this.callId = this.generateCallId();
            this.userIdEl.textContent = this.userId;
            this.callIdEl.textContent = this.callId;
        }
    }

    generateUserId() {
        return `user_${Math.random().toString(36).substr(2, 8)}`;
    }

    generateCallId() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 8);
        return `call_${timestamp}_${randomId}`;
    }

    bindEvents() {
        this.playBtn.addEventListener('click', () => this.handlePlay());
        this.pauseBtn.addEventListener('click', () => this.handlePause());
        this.stopBtn.addEventListener('click', () => this.handleStop());
    }

    async handlePlay() {
        try {
            if (this.status === 'idle') {
                await this.initializeStream();
            } else if (this.status === 'paused') {
                await this.resumeStream();
            }
        } catch (error) {
            console.error('Play error:', error);
            this.updateStatus('error', `Error: ${error.message}`);
        }
    }

    async handlePause() {
        if (this.videoPlayer) {
            this.videoPlayer.pause();
            this.updateStatus('paused', 'Stream paused');
            this.updateControls('paused');
        }
    }

    async handleStop() {
        // Stop video playback
        if (this.videoPlayer) {
            this.videoPlayer.pause();
            this.videoPlayer.srcObject = null;
        }

        // Stop all media tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Stop stats updates
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        // Update UI
        this.updateStatus('idle', 'Ready to stream');
        this.updateControls('idle');
        this.hideStats();
    }

    async initializeStream() {
        this.updateStatus('connecting', 'Initializing stream...');
        this.updateControls('connecting');

        try {
            // Call backend API to initialize stream
            const response = await fetch('/api/stream/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userId,
                    callId: this.callId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initialize stream');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Stream initialization failed');
            }

            this.streamToken = data.token;

            // Setup WebRTC connection
            await this.setupWebRTC();

            // Start stream
            await this.startStream();

            this.updateStatus('playing', 'Stream active');
            this.updateControls('playing');
            this.showStats();
            this.startStatsUpdate();

        } catch (error) {
            console.error('Stream initialization error:', error);
            this.updateStatus('error', `Error: ${error.message}`);
            this.updateControls('error');
            throw error;
        }
    }

    async setupWebRTC() {
        console.log('Setting up WebRTC connection...');

        // In production, this would:
        // 1. Create RTCPeerConnection with STUN/TURN servers from Stream
        // 2. Exchange SDP offers/answers with Stream server
        // 3. Handle ICE candidates
        // 4. Connect to Stream's edge network

        // For demo purposes, we'll use getUserMedia to capture both video and audio
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true  // Enable audio capture for interview
            });

            console.log('Media stream acquired (video + audio)');
        } catch (error) {
            console.error('Failed to get user media:', error);
            throw new Error('Camera/microphone access denied or not available');
        }
    }

    async startStream() {
        if (this.videoPlayer && this.mediaStream) {
            this.videoPlayer.srcObject = this.mediaStream;
            await this.videoPlayer.play();
            console.log('Stream started');
        }
    }

    async resumeStream() {
        if (this.videoPlayer) {
            await this.videoPlayer.play();
            this.updateStatus('playing', 'Stream active');
            this.updateControls('playing');
        }
    }

    updateStatus(status, message) {
        this.status = status;
        this.statusText.textContent = message;

        // Update connection status badge
        this.connectionStatus.className = 'status-badge';
        this.connectionStatus.classList.add(`status-${status}`);
        this.connectionStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }

    updateControls(state) {
        switch (state) {
            case 'idle':
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = true;
                break;
            case 'connecting':
                this.playBtn.disabled = true;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = true;
                break;
            case 'playing':
                this.playBtn.disabled = true;
                this.pauseBtn.disabled = false;
                this.stopBtn.disabled = false;
                break;
            case 'paused':
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = false;
                break;
            case 'error':
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = true;
                break;
        }
    }

    showStats() {
        this.statsContainer.style.display = 'block';
    }

    hideStats() {
        this.statsContainer.style.display = 'none';
        this.statFps.textContent = '--';
        this.statLatency.textContent = '--';
        this.statBitrate.textContent = '--';
        this.statResolution.textContent = '--';
    }

    startStatsUpdate() {
        // Update stats every second
        this.statsInterval = setInterval(() => {
            this.updateStreamStats();
        }, 1000);
    }

    async updateStreamStats() {
        try {
            // In production, get real stats from WebRTC or Stream API
            // For demo, we'll use mock data or calculate from video element

            if (this.videoPlayer && this.mediaStream) {
                const videoTrack = this.mediaStream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();

                // Real resolution from video track
                const resolution = `${settings.width || 0}x${settings.height || 0}`;
                this.statResolution.textContent = resolution;

                // Mock FPS (could be calculated from video frames)
                this.statFps.textContent = `${settings.frameRate || 30} fps`;

                // Mock latency
                const latency = Math.floor(Math.random() * 10) + 20; // 20-30ms
                this.statLatency.textContent = `${latency} ms`;

                // Mock bitrate
                const bitrate = Math.floor(Math.random() * 500) + 2000; // 2000-2500 kbps
                this.statBitrate.textContent = `${(bitrate / 1000).toFixed(1)} Mbps`;
            }
        } catch (error) {
            console.error('Stats update error:', error);
        }
    }
}

// Initialize the client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.streamClient = new VideoStreamClient();
});

/**
 * Gemini AI Integration
 * Handles video frame analysis using Gemini Vision API
 */

class GeminiClient {
    constructor(videoStreamClient) {
        this.videoClient = videoStreamClient;
        this.geminiAvailable = false;

        // DOM elements
        this.geminiContainer = document.getElementById('geminiContainer');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.geminiStatus = document.getElementById('geminiStatus');
        this.geminiResponse = document.getElementById('geminiResponse');

        // Bind events
        this.bindEvents();

        // Check Gemini status
        this.checkGeminiStatus();
    }

    bindEvents() {
        if (this.analyzeBtn) {
            this.analyzeBtn.addEventListener('click', () => this.analyzeCurrentFrame());
        }
    }

    async checkGeminiStatus() {
        try {
            const response = await fetch('/api/gemini/status');
            const data = await response.json();

            this.geminiAvailable = data.available;

            if (data.available) {
                this.geminiStatus.textContent = '✅ ' + data.message;
                this.geminiStatus.className = 'gemini-status ready';
            } else {
                this.geminiStatus.textContent = '⚠️ ' + data.message;
                this.geminiStatus.className = 'gemini-status error';
                this.analyzeBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error checking Gemini status:', error);
            this.geminiStatus.textContent = '❌ Could not connect to Gemini service';
            this.geminiStatus.className = 'gemini-status error';
        }
    }

    showGeminiContainer() {
        if (this.geminiContainer) {
            this.geminiContainer.style.display = 'block';
        }
    }

    hideGeminiContainer() {
        if (this.geminiContainer) {
            this.geminiContainer.style.display = 'none';
        }
    }

    captureFrame() {
        // Create canvas to capture video frame
        const canvas = document.createElement('canvas');
        const video = this.videoClient.videoPlayer;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    async analyzeCurrentFrame() {
        if (!this.geminiAvailable) {
            alert('Gemini AI is not configured. Please add GOOGLE_API_KEY to your .env file.');
            return;
        }

        // Check if video is playing
        if (this.videoClient.status !== 'playing') {
            alert('Please start the video stream first!');
            return;
        }

        try {
            // Disable button and show loading
            this.analyzeBtn.disabled = true;
            this.analyzeBtn.textContent = 'Analyzing...';
            this.geminiResponse.innerHTML = '<p class="loading">🤖 Gemini is analyzing the video frame...</p>';
            this.geminiResponse.className = 'gemini-response loading';

            // Capture current frame
            const frameData = this.captureFrame();

            // Send to Gemini
            const response = await fetch('/api/gemini/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: frameData,
                    prompt: 'Describe what you see in this video frame in detail. Mention objects, people, colors, and any activities happening.'
                })
            });

            const data = await response.json();

            // Display result
            if (data.success) {
                this.geminiResponse.innerHTML = `<p class="analysis-text">${data.analysis}</p>`;
                this.geminiResponse.className = 'gemini-response';
            } else {
                this.geminiResponse.innerHTML = `<p style="color: var(--danger-color);">❌ Error: ${data.error}</p>`;
                this.geminiResponse.className = 'gemini-response';
            }

        } catch (error) {
            console.error('Error analyzing frame:', error);
            this.geminiResponse.innerHTML = `<p style="color: var(--danger-color);">❌ Failed to analyze frame: ${error.message}</p>`;
            this.geminiResponse.className = 'gemini-response';
        } finally {
            // Re-enable button
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.textContent = 'Analyze Frame';
        }
    }
}

/**
 * AI Interview Client
 * Handles interview flow, speech recognition, and AI conversation
 */

class InterviewClient {
    constructor(videoStreamClient) {
        this.videoClient = videoStreamClient;
        this.recognition = null;
        this.isListening = false;
        this.interviewActive = false;
        this.sessionId = null;
        this.interviewType = 'general';
        this.currentTranscript = '';
        this.silenceTimer = null;

        // DOM elements
        this.interviewContainer = document.getElementById('interviewContainer');
        this.startInterviewBtn = document.getElementById('startInterviewBtn');
        this.interviewTypeSelect = document.getElementById('interviewTypeSelect');
        this.transcriptContainer = document.getElementById('transcriptContainer');
        this.listeningIndicator = document.getElementById('listeningIndicator');

        // Initialize Speech Recognition
        this.initializeSpeechRecognition();

        // Bind events
        this.bindEvents();
    }

    initializeSpeechRecognition() {
        // Check if browser supports Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported in this browser');
            if (this.startInterviewBtn) {
                this.startInterviewBtn.disabled = true;
                this.startInterviewBtn.textContent = 'Speech Recognition Not Supported';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
            this.showListeningIndicator();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update current transcript
            if (finalTranscript) {
                this.currentTranscript += finalTranscript;
                console.log('Final transcript:', finalTranscript);

                // Reset silence timer - user is speaking
                this.resetSilenceTimer();

                // Start timer to detect when user stops speaking
                this.startSilenceTimer();
            }

            // Show interim results
            if (interimTranscript) {
                this.updateInterimTranscript(interimTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Restart recognition if no speech detected
                if (this.interviewActive) {
                    this.recognition.start();
                }
            }
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            this.isListening = false;
            this.hideListeningIndicator();

            // Restart if interview is still active
            if (this.interviewActive) {
                this.recognition.start();
            }
        };
    }

    bindEvents() {
        if (this.startInterviewBtn) {
            this.startInterviewBtn.addEventListener('click', () => this.toggleInterview());
        }
    }

    async toggleInterview() {
        if (this.interviewActive) {
            this.stopInterview();
        } else {
            await this.startInterview();
        }
    }

    async startInterview() {
        // Check if video stream is active
        if (this.videoClient.status !== 'playing') {
            alert('Please start the video stream first!');
            return;
        }

        this.interviewActive = true;
        this.sessionId = this.videoClient.callId;
        this.interviewType = this.interviewTypeSelect.value;

        // Update UI
        this.startInterviewBtn.textContent = 'Stop Interview';
        this.startInterviewBtn.classList.add('active');
        this.showInterviewContainer();

        // Clear transcript
        this.transcriptContainer.innerHTML = '';
        this.currentTranscript = '';

        try {
            // Start interview on backend
            const response = await fetch('/api/interview/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    interviewType: this.interviewType
                })
            });

            const data = await response.json();

            if (data.success) {
                // Display first question
                this.addMessageToTranscript('ai', data.firstQuestion);

                // Start speech recognition
                if (this.recognition) {
                    this.recognition.start();
                }
            } else {
                alert('Failed to start interview: ' + data.error);
                this.stopInterview();
            }

        } catch (error) {
            console.error('Error starting interview:', error);
            alert('Failed to start interview');
            this.stopInterview();
        }
    }

    stopInterview() {
        this.interviewActive = false;

        // Stop speech recognition
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }

        // Clear timers
        this.resetSilenceTimer();

        // Update UI
        this.startInterviewBtn.textContent = 'Start AI Interview';
        this.startInterviewBtn.classList.remove('active');
        this.hideListeningIndicator();

        console.log('Interview stopped');
    }

    startSilenceTimer() {
        // After 2 seconds of silence, send the transcript to AI
        this.silenceTimer = setTimeout(() => {
            this.processUserResponse();
        }, 2000);
    }

    resetSilenceTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
    }

    async processUserResponse() {
        if (!this.currentTranscript.trim()) {
            return;
        }

        const userResponse = this.currentTranscript.trim();
        this.currentTranscript = '';

        // Add user's response to transcript
        this.addMessageToTranscript('user', userResponse);

        // Clear interim display
        this.updateInterimTranscript('');

        try {
            // Send to backend for AI response
            const response = await fetch('/api/interview/respond', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    userResponse: userResponse
                })
            });

            const data = await response.json();

            if (data.success) {
                // Add AI's response to transcript
                this.addMessageToTranscript('ai', data.response);
            } else {
                console.error('AI response error:', data.error);
                this.addMessageToTranscript('system', 'Error: ' + data.error);
            }

        } catch (error) {
            console.error('Error getting AI response:', error);
            this.addMessageToTranscript('system', 'Error connecting to AI');
        }
    }

    addMessageToTranscript(role, message) {
        const messageEl = document.createElement('div');
        messageEl.className = `transcript-message transcript-${role}`;

        const labelEl = document.createElement('div');
        labelEl.className = 'message-label';
        labelEl.textContent = role === 'ai' ? '🤖 AI Interviewer' : role === 'user' ? '👤 You' : 'ℹ️ System';

        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        contentEl.textContent = message;

        messageEl.appendChild(labelEl);
        messageEl.appendChild(contentEl);

        this.transcriptContainer.appendChild(messageEl);

        // Scroll to bottom
        this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
    }

    updateInterimTranscript(text) {
        // Remove previous interim element
        const existingInterim = this.transcriptContainer.querySelector('.transcript-interim');
        if (existingInterim) {
            existingInterim.remove();
        }

        if (text.trim()) {
            const interimEl = document.createElement('div');
            interimEl.className = 'transcript-message transcript-interim';

            const labelEl = document.createElement('div');
            labelEl.className = 'message-label';
            labelEl.textContent = '👤 You (speaking...)';

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            contentEl.textContent = text;
            contentEl.style.opacity = '0.6';
            contentEl.style.fontStyle = 'italic';

            interimEl.appendChild(labelEl);
            interimEl.appendChild(contentEl);

            this.transcriptContainer.appendChild(interimEl);
            this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
        }
    }

    showListeningIndicator() {
        if (this.listeningIndicator) {
            this.listeningIndicator.style.display = 'flex';
        }
    }

    hideListeningIndicator() {
        if (this.listeningIndicator) {
            this.listeningIndicator.style.display = 'none';
        }
    }

    showInterviewContainer() {
        if (this.interviewContainer) {
            this.interviewContainer.style.display = 'block';
        }
    }

    hideInterviewContainer() {
        if (this.interviewContainer) {
            this.interviewContainer.style.display = 'none';
        }
    }
}

// Initialize Gemini client when stream client is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for streamClient to be initialized
    setTimeout(() => {
        if (window.streamClient) {
            window.geminiClient = new GeminiClient(window.streamClient);
            window.interviewClient = new InterviewClient(window.streamClient);

            // Show Gemini container when stream starts
            const originalHandlePlay = window.streamClient.handlePlay.bind(window.streamClient);
            window.streamClient.handlePlay = async function() {
                await originalHandlePlay();
                if (window.geminiClient) {
                    window.geminiClient.showGeminiContainer();
                }
            };

            // Hide Gemini container and stop interview when stream stops
            const originalHandleStop = window.streamClient.handleStop.bind(window.streamClient);
            window.streamClient.handleStop = function() {
                originalHandleStop();
                if (window.geminiClient) {
                    window.geminiClient.hideGeminiContainer();
                }
                if (window.interviewClient && window.interviewClient.interviewActive) {
                    window.interviewClient.stopInterview();
                }
            };
        }
    }, 100);
});
