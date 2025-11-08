/**
 * AI Interview Client
 * Handles video call, speech recognition, and interview flow
 */

class AIInterviewClient {
    constructor() {
        // DOM elements
        this.videoPlayer = document.getElementById('videoPlayer');
        this.startBtn = document.getElementById('startInterviewBtn');
        this.endBtn = document.getElementById('endInterviewBtn');
        this.interviewStatus = document.getElementById('interviewStatus');
        this.callIdEl = document.getElementById('callId');
        this.currentQuestionPanel = document.getElementById('currentQuestionPanel');
        this.currentQuestionText = document.getElementById('currentQuestionText');
        this.questionMeta = document.getElementById('questionMeta');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
        this.transcriptContainer = document.getElementById('transcriptContainer');
        this.listeningIndicator = document.getElementById('listeningIndicator');

        // State
        this.callId = null;
        this.userId = null;
        this.mediaStream = null;
        this.isActive = false;
        this.currentQuestion = null;
        this.totalQuestions = 0;
        this.currentQuestionNumber = 0;

        // Speech recognition
        this.recognition = null;
        this.isListening = false;
        this.speechBuffer = '';

        // Initialize
        this.init();
    }

    async init() {
        // Generate session IDs
        await this.generateSessionIds();

        // Bind events
        this.bindEvents();

        // Setup speech recognition
        this.setupSpeechRecognition();

        console.log('AI Interview Client initialized');
    }

    async generateSessionIds() {
        try {
            const response = await fetch('/api/session/new');
            const data = await response.json();

            this.userId = data.userId;
            this.callId = data.callId;
            this.callIdEl.textContent = this.callId;
        } catch (error) {
            console.error('Failed to generate session IDs:', error);
            this.callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            this.userId = `user_${Math.random().toString(36).substr(2, 8)}`;
            this.callIdEl.textContent = this.callId;
        }
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startInterview());
        this.endBtn.addEventListener('click', () => this.endInterview());
    }

    setupSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

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

            // Update speech buffer
            if (finalTranscript) {
                this.speechBuffer += finalTranscript;
                console.log('Speech captured:', finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Restart recognition
                if (this.isListening) {
                    this.recognition.start();
                }
            }
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                // Auto-restart if still listening
                this.recognition.start();
            }
        };

        console.log('Speech recognition initialized');
    }

    startListening() {
        if (!this.recognition) {
            console.warn('Speech recognition not available');
            return;
        }

        try {
            this.isListening = true;
            this.speechBuffer = '';
            this.recognition.start();
            this.listeningIndicator.classList.add('active');
            console.log('Started listening...');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }

    stopListening() {
        if (!this.recognition) return;

        try {
            this.isListening = false;
            this.recognition.stop();
            this.listeningIndicator.classList.remove('active');
            console.log('Stopped listening');

            // Return captured speech
            const capturedSpeech = this.speechBuffer.trim();
            this.speechBuffer = '';
            return capturedSpeech;
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
            return '';
        }
    }

    async startInterview() {
        try {
            this.updateStatus('Connecting...', 'status-active');
            this.startBtn.disabled = true;

            // Get camera access
            await this.setupCamera();

            // Start interview session
            const response = await fetch('/api/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callId: this.callId,
                    userId: this.userId
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to start interview');
            }

            // Update state
            this.isActive = true;
            this.totalQuestions = data.total_questions || data.totalQuestions || 0;

            // Display first question
            if (data.first_question || data.firstQuestion) {
                this.displayQuestion(data.first_question || data.firstQuestion);
            }

            // Update UI
            this.updateStatus('Interview Active', 'status-active');
            this.endBtn.disabled = false;

            // Start listening for answers
            this.startListening();

            // Start transcript polling
            this.startTranscriptPolling();

            console.log('Interview started successfully');

        } catch (error) {
            console.error('Failed to start interview:', error);
            this.updateStatus('Error: ' + error.message, 'status-idle');
            this.startBtn.disabled = false;
            alert('Failed to start interview: ' + error.message);
        }
    }

    async setupCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });

            this.videoPlayer.srcObject = this.mediaStream;
            await this.videoPlayer.play();
            console.log('Camera setup complete');
        } catch (error) {
            console.error('Camera setup failed:', error);
            throw new Error('Camera access denied or not available');
        }
    }

    displayQuestion(questionData) {
        this.currentQuestion = questionData;
        this.currentQuestionNumber = questionData.question_number || questionData.questionNumber || 0;

        this.currentQuestionText.textContent = questionData.question;
        this.questionMeta.textContent = `Question ${this.currentQuestionNumber} of ${this.totalQuestions}`;

        this.currentQuestionPanel.style.display = 'block';

        // Update progress
        this.updateProgress();

        // Add question to transcript
        this.addToTranscript('AI Interviewer', questionData.question);

        // Speak the question (text-to-speech)
        this.speakText(questionData.question);

        // Set timer to collect answer after question is spoken
        setTimeout(() => {
            this.collectAnswer();
        }, 3000); // Wait 3 seconds after question
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        }
    }

    async collectAnswer() {
        // Wait for user to answer (e.g., 30 seconds)
        console.log('Collecting answer...');

        // For demo: automatically submit after 15 seconds
        setTimeout(async () => {
            const answer = this.stopListening();

            if (answer) {
                await this.submitAnswer(answer);
            } else {
                console.log('No answer detected, waiting for manual input...');
                // Could add a manual input option here
            }
        }, 15000); // 15 seconds to answer
    }

    async submitAnswer(answerText) {
        try {
            console.log('Submitting answer:', answerText);

            // Add answer to transcript
            this.addToTranscript('Candidate', answerText);

            // Submit to backend
            const response = await fetch(`/api/interview/${this.callId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: answerText })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to submit answer');
            }

            // Check if interview is complete
            if (data.interview_complete || data.interviewComplete) {
                await this.handleInterviewComplete();
                return;
            }

            // Display next question
            if (data.next_question || data.nextQuestion) {
                setTimeout(() => {
                    this.displayQuestion(data.next_question || data.nextQuestion);
                    this.startListening(); // Start listening for next answer
                }, 2000); // 2 second pause between questions
            }

        } catch (error) {
            console.error('Failed to submit answer:', error);
        }
    }

    async handleInterviewComplete() {
        console.log('Interview complete!');
        this.updateStatus('Interview Complete', 'status-ended');
        this.stopListening();

        // Show completion message
        this.currentQuestionText.textContent = 'Thank you for completing the interview!';
        this.questionMeta.textContent = 'All questions answered';

        this.speakText('Thank you for completing the interview. We will be in touch soon!');
    }

    async endInterview() {
        try {
            this.updateStatus('Ending interview...', 'status-ended');
            this.endBtn.disabled = true;

            // Stop listening
            this.stopListening();

            // Stop transcript polling
            this.stopTranscriptPolling();

            // End interview session
            const response = await fetch(`/api/interview/${this.callId}/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                console.log('Interview ended:', data);

                // Show summary
                if (data.summary) {
                    alert(`Interview Summary:\n` +
                          `Duration: ${data.summary.duration_minutes?.toFixed(1) || 0} minutes\n` +
                          `Questions Answered: ${data.summary.questions_answered || 0}/${data.summary.questions_asked || 0}\n` +
                          `Completion Rate: ${data.summary.completion_rate?.toFixed(0) || 0}%`);
                }
            }

            // Stop camera
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
                this.videoPlayer.srcObject = null;
            }

            // Reset UI
            this.updateStatus('Interview Ended', 'status-ended');
            this.isActive = false;

        } catch (error) {
            console.error('Failed to end interview:', error);
            this.updateStatus('Error ending interview', 'status-idle');
        }
    }

    updateStatus(text, statusClass) {
        this.interviewStatus.textContent = text;
        this.interviewStatus.className = 'status-badge ' + statusClass;
    }

    updateProgress() {
        const progress = (this.currentQuestionNumber / this.totalQuestions) * 100;
        this.progressText.textContent = `${this.currentQuestionNumber} / ${this.totalQuestions} questions`;
        this.progressFill.style.width = progress + '%';
    }

    addToTranscript(speaker, text) {
        const entry = document.createElement('div');
        entry.className = 'transcript-entry ' + (speaker === 'AI Interviewer' ? 'ai' : 'candidate');

        const speakerEl = document.createElement('div');
        speakerEl.className = 'transcript-speaker';
        speakerEl.textContent = speaker;

        const textEl = document.createElement('div');
        textEl.className = 'transcript-text';
        textEl.textContent = text;

        const timeEl = document.createElement('div');
        timeEl.className = 'transcript-time';
        timeEl.textContent = new Date().toLocaleTimeString();

        entry.appendChild(speakerEl);
        entry.appendChild(textEl);
        entry.appendChild(timeEl);

        // Clear placeholder if present
        if (this.transcriptContainer.querySelector('p')) {
            this.transcriptContainer.innerHTML = '';
        }

        this.transcriptContainer.appendChild(entry);

        // Scroll to bottom
        this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
    }

    startTranscriptPolling() {
        // Poll for transcript updates every 2 seconds
        this.transcriptPollInterval = setInterval(async () => {
            await this.fetchTranscript();
        }, 2000);
    }

    stopTranscriptPolling() {
        if (this.transcriptPollInterval) {
            clearInterval(this.transcriptPollInterval);
            this.transcriptPollInterval = null;
        }
    }

    async fetchTranscript() {
        try {
            const response = await fetch(`/api/interview/${this.callId}/transcript`);
            const data = await response.json();

            if (data.success && data.transcript) {
                // Update transcript display (simplified - in production, diff and append new entries)
                console.log('Transcript updated:', data.transcript.length, 'entries');
            }
        } catch (error) {
            console.error('Failed to fetch transcript:', error);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.interviewClient = new AIInterviewClient();
});
