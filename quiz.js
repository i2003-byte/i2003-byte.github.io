// Quiz App Game Logic

class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.gameInProgress = false;
        this.errors = [];

        this.init();
    }

    init() {
        try {
            this.loadQuestions();
            this.setupEventListeners();
            this.loadGameState();
            this.updateUI(); // Ensure UI is updated with high score
            this.logAction('App initialized successfully');
        } catch (error) {
            this.handleError('Initialization failed', error);
        }
    }

    loadQuestions() {
        try {
            if (typeof questions === 'undefined') {
                throw new Error('Questions not loaded');
            }
            // Shuffle questions for random order
            this.questions = ([...questions]);
            console.log('Questions loaded:', this.questions.length);
            this.logAction(`Loaded ${this.questions.length} questions`);
        } catch (error) {
            this.handleError('Failed to load questions', error);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        document.querySelectorAll('.option').forEach(button => {
            button.addEventListener('click', (e) => this.selectAnswer(parseInt(e.target.dataset.index)));
        });

        const submitBtn = document.getElementById('submit-btn');
        const nextBtn = document.getElementById('next-btn');
        const resetBtn = document.getElementById('reset-btn');
        const headerResetBtn = document.getElementById('header-reset-btn');
        const startQuizBtn = document.getElementById('start-quiz-btn');
        const reportBtn = document.getElementById('report-btn');

        if (submitBtn) submitBtn.addEventListener('click', () => this.submitAnswer());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetQuiz());
        if (headerResetBtn) headerResetBtn.addEventListener('click', () => this.resetQuiz());
        if (startQuizBtn) startQuizBtn.addEventListener('click', () => this.startQuiz());
        if (reportBtn) reportBtn.addEventListener('click', () => this.reportIssue());

        console.log('Event listeners set up');
    }

    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('question-container').classList.add('hidden');
        document.getElementById('feedback').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');

        this.logAction('Start screen shown');
    }

    startQuiz() {
        // Hide start screen and show question container
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('question-container').classList.remove('hidden');

        // Check if we have saved state to resume from
        const savedState = localStorage.getItem('quizState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
                    // Resume from saved state
                    this.currentQuestionIndex = state.currentQuestionIndex;
                    this.score = state.score;
                    //this.questions = state.questions;
                    this.gameInProgress = true;
                    this.selectedAnswer = null;

                    this.logAction('Resuming quiz from saved state');
                } else {
                    // Saved state is too old, start fresh
                    localStorage.removeItem('quizState');
                    this.initializeNewQuiz();
                }
            } catch (error) {
                this.handleError('Failed to load saved state', error);
                this.initializeNewQuiz();
            }
        } else {
            // No saved state, start fresh
            this.initializeNewQuiz();
        }

        // Clear any previous visual states
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
        });

        // Update UI and start
        this.updateUI();
        this.showQuestion();
    }

    initializeNewQuiz() {
        this.gameInProgress = true;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.logAction('Starting new quiz');
    }

    showQuestion() {
        try {
            if (this.currentQuestionIndex >= this.questions.length) {
                this.endGame();
                return;
            }

            const question = this.questions[this.currentQuestionIndex];
            document.getElementById('question-text').textContent = question.question;

            const options = document.querySelectorAll('.option');
            options.forEach((option, index) => {
                option.textContent = question.options[index];
                option.classList.remove('selected', 'correct', 'incorrect');
            });

            // Reset state for new question
            this.selectedAnswer = null;
            this.gameInProgress = true;

            // Hide submit button until answer is selected
            document.getElementById('submit-btn').classList.add('hidden');

            // Hide feedback and show question container
            this.hideFeedback();

            // Update UI including question counter
            this.updateUI();

            this.logAction(`Showing question ${this.currentQuestionIndex + 1}`);
        } catch (error) {
            this.handleError('Failed to show question', error);
        }
    }

    selectAnswer(index) {
        if (!this.gameInProgress) return;

        // Clear previous selection
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });

        this.selectedAnswer = index;
        const options = document.querySelectorAll('.option');
        options[index].classList.add('selected');

        // Show submit button
        document.getElementById('submit-btn').classList.remove('hidden');

        this.logAction(`Answer selected: ${index}`);
    }

    submitAnswer() {
        if (this.selectedAnswer === null || !this.gameInProgress) return;

        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === question.correct;

        // Highlight correct/incorrect answers
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === this.selectedAnswer && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            this.updateScore(2);
            this.showFeedback(true, 'Correct! 🎉', question.explanation);
        } else {
            this.updateScore(-1);
            this.showFeedback(false, 'Incorrect 😞', question.explanation);
        }

        this.saveGameState();
        this.gameInProgress = false; // Prevent further interactions

        this.logAction(`Answer submitted: ${isCorrect ? 'correct' : 'incorrect'}`);
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('current-score').textContent = this.score;
    }

    showFeedback(isCorrect, text, explanation) {
        const feedback = document.getElementById('feedback');
        const emoji = document.getElementById('feedback-emoji');
        const feedbackText = document.getElementById('feedback-text');
        const explanationEl = document.getElementById('explanation');

        feedback.className = isCorrect ? 'correct' : 'incorrect';
        emoji.textContent = isCorrect ? '✅' : '❌';
        feedbackText.textContent = text;
        explanationEl.textContent = explanation;

        feedback.classList.remove('hidden');
        document.getElementById('question-container').classList.add('hidden');
    }

    hideFeedback() {
        document.getElementById('feedback').classList.add('hidden');
        document.getElementById('question-container').classList.remove('hidden');
    }

    nextQuestion() {
        // Reset for next question
        this.currentQuestionIndex++;
        this.selectedAnswer = null;
        this.gameInProgress = true;

        // Clear any previous selections
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
        });

        // Hide submit button
        document.getElementById('submit-btn').classList.add('hidden');

        this.showQuestion();

        this.logAction(`Moving to next question: ${this.currentQuestionIndex + 1}`);
    }



    updateUI() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = this.questions.length;
    }

    endGame() {
        this.gameInProgress = false;
        this.saveGameState();

        // Show final score
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('total-questions').textContent = this.questions.length;

        // Show end screen
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('end-screen').classList.remove('hidden');

        this.logAction(`Game ended with score: ${this.score}`);
    }

    resetQuiz() {
        // Reset all game state
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.gameInProgress = false;

        // Clear any visual states
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
        });

        // Reload and shuffle questions
        this.loadQuestions();

        // Update UI
        this.updateUI();

        // Clear saved game state
        this.clearGameState();

        // Go back to start screen
        this.showStartScreen();

        this.logAction('Quiz reset - back to start screen');
    }

    saveGameState() {
        try {
            const state = {
                currentQuestionIndex: this.currentQuestionIndex,
                score: this.score,
                questions: this.questions,
                timestamp: Date.now()
            };
            localStorage.setItem('quizState', JSON.stringify(state));
            this.logAction('Game state saved');
        } catch (error) {
            this.handleError('Failed to save game state', error);
        }
    }

    loadGameState() {
        try {
            const savedState = localStorage.getItem('quizState');
            if (savedState) {
                const state = JSON.parse(savedState);
                // Check if saved state is recent (within 24 hours)
                if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
                    // Store the saved state but don't show questions yet
                    this.currentQuestionIndex = state.currentQuestionIndex;
                    this.score = state.score;
                    //this.questions = state.questions;

                    // Update UI with saved data but stay on start screen
                    this.updateUI();

                    this.logAction('Game state loaded - can resume from start screen');
                } else {
                    localStorage.removeItem('quizState');
                }
            }

            // Always show start screen initially
            this.showStartScreen();
        } catch (error) {
            this.handleError('Failed to load game state', error);
            this.showStartScreen();
        }
    }

    clearGameState() {
        localStorage.removeItem('quizState');
    }

    saveHighScore() {
        try {
            const currentHighScore = localStorage.getItem('quizHighScore');
            const highScore = currentHighScore ? parseInt(currentHighScore) : 0;

            if (this.score > highScore) {
                localStorage.setItem('quizHighScore', this.score.toString());
                this.logAction(`New high score saved: ${this.score}`);
            }
        } catch (error) {
            this.handleError('Failed to save high score', error);
        }
    }

    loadHighScore() {
        try {
            const highScore = localStorage.getItem('quizHighScore');
            return highScore ? parseInt(highScore) : 0;
        } catch (error) {
            this.handleError('Failed to load high score', error);
            return 0;
        }
    }

    handleError(message, error) {
        console.error(`[QUIZ ERROR] ${message}:`, error);
        this.errors.push({ message, error: error.message, timestamp: new Date().toISOString() });
        document.getElementById('error-message').classList.remove('hidden');
        this.logAction(`Error: ${message}`);
    }

    reportIssue() {
        const errorDetails = this.errors.map(err => 
            `${err.timestamp}: ${err.message} - ${err.error}`
        ).join('\n');
        const report = `Quiz App Error Report\n\nErrors:\n${errorDetails}\n\nUser Agent: ${navigator.userAgent}\n\nTimestamp: ${new Date().toISOString()}`;

        navigator.clipboard.writeText(report).then(() => {
            alert('Error details copied to clipboard! 📋');
        }).catch(() => {
            alert('Failed to copy to clipboard. Please manually copy the console logs.');
        });
    }

    logAction(action) {
        console.log(`[QUIZ LOG] ${new Date().toISOString()}: ${action}`);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
