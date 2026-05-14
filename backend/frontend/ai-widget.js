// ============================================
// EduFuture AI Assistant – Floating Widget
// Powered by Google Gemini (via backend proxy)
// ============================================

class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    async init() {
        this.render();
        this.attachEvents();
        this.loadMessages();
    }

    render() {
        const widget = document.createElement('div');
        widget.className = 'ai-widget-container';
        widget.innerHTML = `
            <!-- Chat Bubble -->
            <button class="ai-bubble-btn" id="aiBubbleBtn" title="EduFuture AI Assistant">
                <span class="ai-pulse"></span>
                <span class="ai-icon">🤖</span>
            </button>

            <!-- Chat Window -->
            <div class="ai-chat-window" id="aiChatWindow">
                <div class="ai-chat-header">
                    <div class="ai-chat-avatar">🤖</div>
                    <div class="ai-chat-info">
                        <h3>EduFuture AI</h3>
                        <p><span class="ai-online-dot"></span> Online – Ready to help</p>
                    </div>
                    <button class="ai-chat-close" id="aiChatClose">✕</button>
                </div>

                <div class="ai-chat-messages" id="aiChatMessages">
                    <div class="ai-message bot">
                        <div class="ai-message-avatar">🤖</div>
                        <div class="ai-message-bubble">
                            👋 Hello! I'm your EduFuture AI assistant, powered by Google Gemini.<br><br>
                            I can help you with:<br>
                            • 🎯 Finding the perfect university program<br>
                            • 📊 Personalized recommendations based on your interests<br>
                            • 📝 Admission & application guidance<br>
                            • 💰 Fee comparisons<br>
                            • 🏛️ Detailed university info<br><br>
                            Just type your question or use the quick buttons below!
                        </div>
                    </div>
                </div>

                <div class="ai-quick-actions" id="aiQuickActions">
                    <button class="ai-quick-btn" data-action="recommend">🎯 Recommend a program</button>
                    <button class="ai-quick-btn" data-action="universities">🏛️ List universities</button>
                    <button class="ai-quick-btn" data-action="apply">📝 How to apply</button>
                    <button class="ai-quick-btn" data-action="fees">💰 Compare fees</button>
                </div>

                <div class="ai-chat-input-area">
                    <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Type your question...">
                    <button class="ai-send-btn" id="aiSendBtn">➤</button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);
    }

    attachEvents() {
        const bubbleBtn = document.getElementById('aiBubbleBtn');
        const chatWindow = document.getElementById('aiChatWindow');
        const closeBtn = document.getElementById('aiChatClose');
        const sendBtn = document.getElementById('aiSendBtn');
        const input = document.getElementById('aiChatInput');
        const quickActions = document.getElementById('aiQuickActions');

        // Toggle chat
        bubbleBtn.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.closeChat());

        // Send message
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Quick actions
        quickActions.addEventListener('click', (e) => {
            if (e.target.classList.contains('ai-quick-btn')) {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('aiChatWindow');
        window.classList.toggle('open', this.isOpen);
        if (this.isOpen) this.scrollToBottom();
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('aiChatWindow').classList.remove('open');
    }

    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        // Get AI response from backend
        const reply = await this.fetchAIResponse(message);
        this.hideTyping();

        // Add bot reply
        this.addMessage(reply, 'bot');
    }

    handleQuickAction(action) {
        let message = '';
        switch(action) {
            case 'recommend':
                message = 'Can you recommend a good computer science or engineering program based on a GPA of 3.5?';
                break;
            case 'universities':
                message = 'Show me all the universities you have on the platform.';
                break;
            case 'apply':
                message = 'How do I apply to a university through EduFuture?';
                break;
            case 'fees':
                message = 'Compare the tuition fees of different universities.';
                break;
        }
        if (message) {
            document.getElementById('aiChatInput').value = message;
            this.sendMessage();
        }
    }

    addMessage(text, sender) {
        const messagesDiv = document.getElementById('aiChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;

        const avatar = sender === 'bot' ? '🤖' : '👤';
        // Convert newlines to <br> and bold markdown to <strong>
        const formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        messageDiv.innerHTML = `
            <div class="ai-message-avatar">${avatar}</div>
            <div class="ai-message-bubble">${formattedText}</div>
        `;

        messagesDiv.appendChild(messageDiv);
        this.scrollToBottom();

        // Save messages
        this.messages.push({ text, sender, timestamp: Date.now() });
        this.saveMessages();
    }

    showTyping() {
        const messagesDiv = document.getElementById('aiChatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message bot';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="ai-message-avatar">🤖</div>
            <div class="ai-message-bubble">
                <div class="ai-typing">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesDiv.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }

    scrollToBottom() {
        const messagesDiv = document.getElementById('aiChatMessages');
        setTimeout(() => {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 100);
    }

    async fetchAIResponse(message) {
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) throw new Error('Server error');

            const data = await response.json();
            return data.reply || "I couldn't generate a response. Please try again.";

        } catch (error) {
            console.error('AI Widget fetch error:', error);
            return "Oops! I couldn't reach the AI service. Please check your connection or try again later.";
        }
    }

    saveMessages() {
        try {
            localStorage.setItem('aiChatHistory', JSON.stringify(this.messages.slice(-50)));
        } catch (e) {}
    }

    loadMessages() {
        try {
            const saved = JSON.parse(localStorage.getItem('aiChatHistory') || '[]');
            this.messages = saved;
        } catch (e) {
            this.messages = [];
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistant();
});