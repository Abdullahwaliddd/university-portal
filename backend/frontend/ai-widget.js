// ============================================
// EduFuture AI Assistant - Floating Widget
// Local AI, No API Calls Required
// ============================================

class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.universities = [];
        this.majors = [];
        this.init();
    }

    async init() {
        // Fetch data for recommendations
        try {
            const [uniRes, majorRes] = await Promise.all([
                fetch('/api/universities'),
                fetch('/api/majors')
            ]);
            this.universities = await uniRes.json();
            this.majors = await majorRes.json();
        } catch (e) {
            console.log('AI Widget: Could not load data, using defaults');
        }
        
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
                        <p><span class="ai-online-dot"></span> Online - Ready to help</p>
                    </div>
                    <button class="ai-chat-close" id="aiChatClose">✕</button>
                </div>

                <div class="ai-chat-messages" id="aiChatMessages">
                    <div class="ai-message bot">
                        <div class="ai-message-avatar">🤖</div>
                        <div class="ai-message-bubble">
                            👋 Hello! I'm your EduFuture AI assistant. I can help you:<br><br>
                            • Find the perfect university program<br>
                            • Recommend majors based on your interests<br>
                            • Answer questions about admissions<br>
                            • Compare universities<br><br>
                            How can I help you today?
                        </div>
                    </div>
                </div>

                <div class="ai-quick-actions" id="aiQuickActions">
                    <button class="ai-quick-btn" data-action="recommend">🎯 Recommend Program</button>
                    <button class="ai-quick-btn" data-action="universities">🏛️ List Universities</button>
                    <button class="ai-quick-btn" data-action="apply">📝 How to Apply</button>
                    <button class="ai-quick-btn" data-action="fees">💰 Compare Fees</button>
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
        const window = document.getElementById('aiChatWindow');
        this.isOpen = !this.isOpen;
        window.classList.toggle('open', this.isOpen);
        if (this.isOpen) {
            this.scrollToBottom();
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('aiChatWindow').classList.remove('open');
    }

    sendMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        // Process and respond
        setTimeout(() => {
            this.hideTyping();
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
        }, 1000 + Math.random() * 1500);
    }

    handleQuickAction(action) {
        let message = '';
        switch(action) {
            case 'recommend':
                message = 'I want to find a program recommendation';
                break;
            case 'universities':
                message = 'Show me the available universities';
                break;
            case 'apply':
                message = 'How do I apply to a university?';
                break;
            case 'fees':
                message = 'Compare fees between universities';
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
        const formattedText = text.replace(/\n/g, '<br>');
        
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

    generateResponse(message) {
        const msg = message.toLowerCase();

        // Program Recommendation
        if (msg.includes('recommend') || msg.includes('find') || msg.includes('suggest') || msg.includes('which program')) {
            return this.getRecommendation();
        }

        // List Universities
        if (msg.includes('university') || msg.includes('universities') || msg.includes('list') || msg.includes('available')) {
            return this.listUniversities();
        }

        // How to Apply
        if (msg.includes('apply') || msg.includes('application') || msg.includes('how to')) {
            return `📝 **How to Apply:**\n\n1. Register for an account on EduFuture\n2. Browse universities and programs\n3. Click "Apply Now" on your chosen program\n4. Fill in your academic details (GPA, scores)\n5. Submit your application\n6. Track your application status from your dashboard\n\nYou can also visit our <a href="register.html">Registration Page</a> to get started!`;
        }

        // Compare Fees
        if (msg.includes('fee') || msg.includes('cost') || msg.includes('price') || msg.includes('tuition')) {
            return this.compareFees();
        }

        // Greetings
        if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
            return 'Hello! 👋 How can I help you with your university search today? You can ask me for program recommendations, university listings, or admission guidance!';
        }

        // Help
        if (msg.includes('help') || msg.includes('what can you do')) {
            return 'I can help you with:\n\n🎯 Finding the right program\n🏛️ Listing universities\n📝 Application guidance\n💰 Fee comparisons\n\nJust type your question or use the quick buttons below!';
        }

        // Default response
        return 'I understand you\'re asking about "' + message + '". For the best assistance, try asking about:\n\n• Program recommendations\n• University listings\n• Application process\n• Fee comparisons\n\nOr use the quick buttons below! 😊';
    }

    getRecommendation() {
        if (this.universities.length === 0) {
            return 'I need to load the university data first. Please try again in a moment!';
        }

        // Pick top recommendations
        const recommendations = this.universities.slice(0, 3);
        const majors = this.majors.slice(0, 3);

        let response = '🎯 **Top Program Recommendations:**\n\n';
        
        recommendations.forEach((uni, index) => {
            const major = majors[index] || majors[0];
            response += `**${index + 1}. ${uni.Name}**\n`;
            response += `   📍 ${uni.Location || 'Egypt'}\n`;
            response += `   🎓 Recommended: ${major?.Name || 'Various Programs'}\n`;
            response += `   🔗 <a href="university.html?id=${uni.University_ID}" target="_blank">View Details →</a>\n\n`;
        });

        response += '💡 Want a personalized recommendation? Tell me your interests and GPA!';
        return response;
    }

    listUniversities() {
        if (this.universities.length === 0) {
            return 'Loading university data... Please try again!';
        }

        let response = `🏛️ **Our Partner Universities (${this.universities.length}):**\n\n`;
        this.universities.forEach(uni => {
            response += `• **${uni.Name}** - 📍 ${uni.Location || 'Egypt'}\n`;
        });
        response += '\nClick on any university card on our homepage for detailed info!';
        return response;
    }

    compareFees() {
        return `💰 **Fee Comparison (Annual Tuition):**\n\n` +
               `• Galala University: ~90,000 EGP\n` +
               `• GUC: ~320,000 EGP\n` +
               `• AUC: ~725,000 EGP\n` +
               `• Coventry / TKH: ~110,000 EGP\n` +
               `• MSA University: ~60,000-110,000 EGP\n\n` +
               `Fees vary by program. Check each university's page for exact costs.`;
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