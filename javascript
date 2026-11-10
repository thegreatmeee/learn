/**
 * EduStreak Application Logic
 * Handles User State, Streaks, and AI-like Question Generation
 */

const app = {
    state: {
        currentUser: null,
        currentClass: null,
        streak: 0,
        lastLoginDate: null,
        totalQuizzes: 0,
        currentQuiz: [],
        currentQuestionIndex: 0,
        score: 0
    },

    // Initialize App
    init: function() {
        this.loadUserData();
        this.updateStreakDisplay();
        
        // Check if user is already logged in (session storage)
        const savedUser = sessionStorage.getItem('eduStreakUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            this.state.currentUser = user.name;
            this.state.currentClass = user.class;
            this.showDashboard();
        }
    },

    // Load data from LocalStorage
    loadUserData: function() {
        const storedData = localStorage.getItem('eduStreakData');
        if (storedData) {
            const data = JSON.parse(storedData);
            this.state.streak = data.streak || 0;
            this.state.lastLoginDate = data.lastLoginDate;
            this.state.totalQuizzes = data.totalQuizzes || 0;
        }
    },

    // Save data to LocalStorage
    saveUserData: function() {
        localStorage.setItem('eduStreakData', JSON.stringify({
            streak: this.state.streak,
            lastLoginDate: this.state.lastLoginDate,
            totalQuizzes: this.state.totalQuizzes
        }));
    },

    // Handle Login
    login: function() {
        const name = document.getElementById('usernameInput').value.trim();
        const selectedClass = document.getElementById('classSelect').value;

        if (!name) {
            alert("Please enter your name!");
            return;
        }

        // Update Streak Logic
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (this.state.lastLoginDate === today) {
            // Already logged in today
        } else if (this.state.lastLoginDate === yesterday) {
            this.state.streak++;
        } else {
            this.state.streak = 1; // Reset or start new
        }

        this.state.lastLoginDate = today;
        this.state.currentUser = name;
        this.state.currentClass = selectedClass;

        this.saveUserData();
        sessionStorage.setItem('eduStreakUser', JSON.stringify({ name, class: selectedClass }));
        
        this.showDashboard();
    },

    logout: function() {
        sessionStorage.removeItem('eduStreakUser');
        location.reload();
    },

    showDashboard: function() {
        this.hideAllSections();
        document.getElementById('dashboardSection').classList.remove('hidden-section');
        document.getElementById('dashboardSection').classList.add('active-section');
        
        document.getElementById('displayName').textContent = this.state.currentUser;
        document.getElementById('displayClass').textContent = `Class ${this.state.currentClass}`;
        document.getElementById('totalQuizzes').textContent = this.state.totalQuizzes;
        
        // Update progress bar (Arbitrary scale: 100 quizzes = 100%)
        const progress = Math.min((this.state.totalQuizzes / 100) * 100, 100);
        document.getElementById('progressFill').style.width = `${progress}%`;
    },

    hideAllSections: function() {
        document.querySelectorAll('section').forEach(sec => {
            sec.classList.remove('active-section');
            sec.classList.add('hidden-section');
        });
    },

    updateStreakDisplay: function() {
        document.getElementById('streakCount').textContent = this.state.streak;
    },

    // --- QUIZ LOGIC ---

    startQuiz: function(subject) {
        this.hideAllSections();
        document.getElementById('quizSection').classList.remove('hidden-section');
        document.getElementById('quizSection').classList.add('active-section');
        
        document.getElementById('quizSubjectTitle').textContent = subject;
        
        // Generate 5 questions using our "AI" engine
        this.state.currentQuiz = this.generateQuestions(subject, parseInt(this.state.currentClass), 5);
        this.state.currentQuestionIndex = 0;
        this.state.score = 0;
        
        this.renderQuestion();
    },

    renderQuestion: function() {
        const q = this.state.currentQuiz[this.state.currentQuestionIndex];
        document.getElementById('questionCounter').textContent = `Q${this.state.currentQuestionIndex + 1}/${this.state.currentQuiz.length}`;
        document.getElementById('questionText').textContent = q.question;
        
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        document.getElementById('nextBtn').classList.add('hidden');

        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => this.selectAnswer(index, btn);
            optionsContainer.appendChild(btn);
        });
    },

    selectAnswer: function(selectedIndex, btnElement) {
        const q = this.state.currentQuiz[this.state.currentQuestionIndex];
        const buttons = document.querySelectorAll('.option-btn');
        
        // Disable all buttons
        buttons.forEach(b => b.disabled = true);

        if (selectedIndex === q.correctIndex) {
            btnElement.classList.add('correct');
            this.state.score++;
        } else {
            btnElement.classList.add('wrong');
            // Highlight correct answer
            buttons[q.correctIndex].classList.add('correct');
        }

        document.getElementById('nextBtn').classList.remove('hidden');
    },

    nextQuestion: function() {
        this.state.currentQuestionIndex++;
        if (this.state.currentQuestionIndex < this.state.currentQuiz.length) {
            this.renderQuestion();
        } else {
            this.endQuiz();
        }
    },

    endQuiz: function() {
        this.hideAllSections();
        document.getElementById('resultSection').classList.remove('hidden-section');
        document.getElementById('resultSection').classList.add('active-section');
        
        document.getElementById('scoreDisplay').textContent = this.state.score;
        document.getElementById('totalQuestionsDisplay').textContent = this.state.currentQuiz.length;
        
        const feedback = document.getElementById('feedbackMessage');
        if (this.state.score === this.state.currentQuiz.length) {
            feedback.textContent = "Perfect Score! You're a genius! 🌟";
            feedback.style.color = "#10b981";
        } else if (this.state.score > this.state.currentQuiz.length / 2) {
            feedback.textContent = "Good job! Keep practicing. 👍";
            feedback.style.color = "#f59e0b";
        } else {
            feedback.textContent = "Don't give up! Try again. 💪";
            feedback.style.color = "#ef4444";
        }

        // Update global stats
        this.state.totalQuizzes++;
        this.saveUserData();
    },

    // --- AI SIMULATION ENGINE ---
    
    /**
     * Simulates an AI generating questions based on Class and Subject.
     * In a real app, this would call: 
     * fetch('https://api.openai.com/v1/chat/completions', { body: { messages: [...] } })
     */
    generateQuestions: function(subject, classLevel, count) {
        const questions = [];
        
        // Define templates based on difficulty (Class Level)
        let templates = [];
        
        if (classLevel <= 5) {
            // Simple facts
            templates = [
                { q: "What is {A} + {B}?", type: "math", vars: {a: 2, b: 3}, opts: ["{C}", "{D}", "{E}", "{F]"], ans: 0 },
                { q: "Which animal is known as the King of the Jungle?", type: "science", opts: ["Lion", "Tiger", "Elephant", "Bear"], ans: 0 },
                { q: "What is the capital of India?", type: "history", opts: ["New Delhi", "Mumbai", "Kolkata", "Chennai"], ans: 0 },
                { q: "Choose the correct spelling:", type: "english", opts: ["Hapiness", "Happiness", "Happines", "Happyness"], ans: 1 },
                { q: "How many days are there in a week?", type: "general", opts: ["5", "6", "7", "8"], ans: 2 }
            ];
        } else if (classLevel <= 8) {
            // Intermediate concepts
            templates = [
                { q: "Solve for x: 2x + 4 = 10", type: "math", opts: ["2", "3", "4", "5"], ans: 1 },
                { q: "What is the chemical formula for water?", type: "science", opts: ["CO2", "H2O", "O2", "NaCl"], ans: 1 },
                { q: "Who wrote 'Romeo and Juliet'?", type: "english", opts: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], ans: 1 },
                { q: "The Great Wall of China was built to protect against invasions from?", type: "history", opts: ["South", "East", "North", "West"], ans: 2 },
                { q: "What is the square root of 144?", type: "math", opts: ["10", "11", "12", "13"], ans: 2 }
            ];
        } else {
            // Advanced concepts
            templates = [
                { q: "Calculate the derivative of f(x) = x^2", type: "math", opts: ["x", "2x", "x^2", "2"], ans: 1 },
                { q: "What is the powerhouse of the cell?", type: "science", opts: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], ans: 2 },
                { q: "Who discovered Penicillin?", type: "history", opts: ["Louis Pasteur", "Alexander Fleming", "Marie Curie", "Isaac Newton"], ans: 1 },
                { q: "Identify the figure of speech: 'Time flies'.", type: "english", opts: ["Simile", "Metaphor", "Personification", "Hyperbole"], ans: 2 },
                { q: "What is the value of Pi to two decimal places?", type: "general", opts: ["3.12", "3.14", "3.16", "3.18"], ans: 1 }
            ];
        }

        // Randomly pick questions to ensure variety
        for (let i = 0; i < count; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            
            let questionText = template.q;
            let correctOption = template.opts[template.ans];
            
            // If it's a math problem with variables, inject them
            if (template.vars) {
                questionText = questionText.replace("{A}", template.vars.a).replace("{B}", template.vars.b);
                // Generate wrong answers dynamically for math
                const wrongAnswers = [
                    template.vars.a + template.vars.b + 1,
                    template.vars.a + template.vars.b - 1,
                    template.vars.a * template.vars.b
                ];
                const finalOptions = [template.vars.a + template.vars.b, ...wrongAnswers];
                // Shuffle options
                for (let j = finalOptions.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [finalOptions[j], finalOptions[k]] = [finalOptions[k], finalOptions[j]];
                }
                
                questions.push({
                    question: questionText,
                    options: finalOptions,
                    correctIndex: finalOptions.indexOf(template.vars.a + template.vars.b)
                });
            } else {
                // For static questions, just clone the object
                questions.push({
                    question: questionText,
                    options: [...template.opts],
                    correctIndex: template.ans
                });
            }
        }
        
        return questions;
    }
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
