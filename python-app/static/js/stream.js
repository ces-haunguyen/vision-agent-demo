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

        // For demo purposes, we'll use getUserMedia to simulate incoming stream
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            console.log('Media stream acquired');
        } catch (error) {
            console.error('Failed to get user media:', error);
            throw new Error('Camera access denied or not available');
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
let streamClient;

document.addEventListener('DOMContentLoaded', () => {
    streamClient = new VideoStreamClient();
});
