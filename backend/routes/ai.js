const express = require('express');
const router = express.Router();
const db = require('../db');

// ---------- Environment variables ----------
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';   // <-- Set this in Railway
const GROQ_MODEL = 'llama-3.3-70b-versatile';          // Free on Groq

// ---------- Smart local response generator (fallback) ----------
async function generateLocalResponse(message) {
    const msg = message.toLowerCase();

    // Fetch fresh data from DB
    const [universities] = await db.query('SELECT * FROM university');
    const [majors] = await db.query(
        `SELECT m.*, c.Name as College, u.Name as University 
         FROM major m 
         JOIN college c ON m.College_ID = c.College_ID 
         JOIN university u ON c.University_ID = u.University_ID`
    );

    // ---- Pattern: recommend / suggest / find program ----
    if (/(recommend|suggest|find|which|what).*(program|major|course|university)/.test(msg)) {
        const interests = {
            computer: /computer|software|cs|it|information|data|ai/i,
            engineering: /engineer|mechanical|civil|electrical/i,
            business: /business|management|accounting|finance|marketing/i,
            medical: /medic|doctor|nurs|pharm|dent|health|bio/i,
            arts: /art|design|media|mass|language|translat/i
        };

        let matchedMajors = [];
        for (const [field, regex] of Object.entries(interests)) {
            if (regex.test(msg)) {
                matchedMajors = majors.filter(m => regex.test(m.Name) || regex.test(m.College));
                break;
            }
        }

        if (matchedMajors.length === 0) {
            matchedMajors = majors.slice(0, 3);
        }

        const top3 = matchedMajors.slice(0, 3);
        if (top3.length === 0) {
            return "I couldn't find any matching programs. Try asking about Computer Science, Engineering, or Business!";
        }

        let reply = "🎯 **Top Program Recommendations:**\n\n";
        top3.forEach((m, i) => {
            reply += `**${i + 1}. ${m.Name}**\n   🏛️ ${m.University}\n   📚 ${m.College}\n   🎓 ${m.Degree_Type} (${m.Duration_Years} years)\n\n`;
        });
        reply += "Would you like more details on any of these?";
        return reply;
    }

    // ---- Pattern: list universities ----
    if (/(list|show|all|available).*(university|universities|college)/.test(msg)) {
        let reply = `🏛️ **Our Partner Universities (${universities.length}):**\n\n`;
        universities.forEach(u => {
            reply += `• **${u.Name}** – 📍 ${u.Location || 'Egypt'}\n`;
        });
        reply += "\nClick any university card on our homepage for full details!";
        return reply;
    }

    // ---- Pattern: fees / budget / cost ----
    if (/(fee|cost|tuition|price|expensive|cheap|budget)/.test(msg)) {
        const [fees] = await db.query(
            `SELECT f.*, m.Name as Major, u.Name as University 
             FROM fee f 
             JOIN major m ON f.Major_ID = m.Major_ID 
             JOIN college c ON m.College_ID = c.College_ID 
             JOIN university u ON c.University_ID = u.University_ID`
        );

        if (fees.length === 0) {
            return "💰 Fee information is currently being updated. Generally, tuition ranges from 60,000 to 800,000 EGP annually.";
        }

        // Try to extract a budget number from the message (e.g., "100000", "100k", "100 thousand")
        const budgetMatch = msg.match(/(\d+[\.,]?\d*)\s*(?:k|thousand|EGP|egp)?/i);
        const userBudget = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, '')) * (budgetMatch[0].toLowerCase().includes('k') ? 1000 : 1) : null;

        // Calculate total fee for each program
        const feesWithTotal = fees.map(f => ({
            ...f,
            total: (parseFloat(f.Tuition_Fee) || 0) + (parseFloat(f.Registration_Fee) || 0) + (parseFloat(f.Other_Fees) || 0)
        }));

        // Sort by total fee
        feesWithTotal.sort((a, b) => a.total - b.total);

        let reply = '';

        if (userBudget) {
            // Filter programs within budget
            const withinBudget = feesWithTotal.filter(f => f.total <= userBudget);
            const overBudget = feesWithTotal.filter(f => f.total > userBudget).slice(0, 3);

            reply = `💰 **Programs within your budget of ~${userBudget.toLocaleString()} EGP:**\n\n`;

            if (withinBudget.length === 0) {
                reply += `Unfortunately, no programs fit exactly within ${userBudget.toLocaleString()} EGP.\n\n`;
                reply += `📌 **Cheapest available programs:**\n`;
                feesWithTotal.slice(0, 3).forEach(f => {
                    reply += `• **${f.University}** – ${f.Major}: **${f.total.toLocaleString()}** EGP (${f.Academic_Year || '2025'})\n`;
                });
            } else {
                withinBudget.forEach(f => {
                    reply += `• **${f.University}** – ${f.Major}: **${f.total.toLocaleString()}** EGP (${f.Academic_Year || '2025'})\n`;
                });
            }

            if (overBudget.length > 0) {
                reply += `\n⚠️ **Slightly above your budget:**\n`;
                overBudget.forEach(f => {
                    reply += `• **${f.University}** – ${f.Major}: **${f.total.toLocaleString()}** EGP\n`;
                });
            }

            return reply;
        }

        // No specific budget – show full comparison
        reply = "💰 **Tuition Fee Comparison (Total per Year):**\n\n";
        feesWithTotal.forEach(f => {
            reply += `• **${f.University}** – ${f.Major}: **${f.total.toLocaleString()}** ${f.Currency || 'EGP'} (${f.Academic_Year || '2025'})\n`;
        });
        return reply;
    }

    // ---- Pattern: apply / application / how to ----
    if (/(apply|application|admission|register|how|process)/.test(msg)) {
        return "📝 **How to Apply:**\n\n" +
               "1. 📧 Register for a free account\n" +
               "2. 🏛️ Browse universities and programs\n" +
               "3. 🎯 Click 'Apply Now' on your chosen program\n" +
               "4. 📊 Enter your GPA and high school scores\n" +
               "5. ✅ Submit your application\n" +
               "6. 📈 Track status from your dashboard\n\n" +
               "Need help choosing a program? Just ask for a recommendation!";
    }

    // ---- Pattern: greeting ----
    if (/(hi|hello|hey|greet)/.test(msg)) {
        return "👋 Hello! I'm your EduFuture assistant. I can help you find programs, compare fees, explain admissions, and more. What would you like to know?";
    }

    // ---- Default smart response ----
    return `I can help you with:\n\n🎯 Program recommendations\n🏛️ University listings\n💰 Fee comparisons\n📝 Application guidance\n\nJust tell me what you're interested in! For example: "Recommend a computer science program" or "Compare university fees".`;
}

// ---------- Call Groq API ----------
async function callGroq(userMessage) {
    // Build context from the database
    const [universities] = await db.query('SELECT Name, Location, Type, Website FROM university');
    const [majors] = await db.query(
        `SELECT m.Name, m.Degree_Type, m.Duration_Years, c.Name as College, u.Name as University 
         FROM major m 
         JOIN college c ON m.College_ID = c.College_ID 
         JOIN university u ON c.University_ID = u.University_ID`
    );

    const context = `
You are EduFuture Assistant for a university admission platform in Egypt.
Here is the real platform data:
Universities:
${universities.map(u => `- ${u.Name} (${u.Location}), Type: ${u.Type}`).join('\n')}
Majors:
${majors.slice(0, 30).map(m => `- ${m.Name} at ${m.University}`).join('\n')}
Answer the student's question naturally using this data. Be concise, helpful, and friendly.
`.trim();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: context },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 500
        })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// ---------- Main route ----------
router.post('/chat', async (req, res) => {
    const { message } = req.body;

    // 1. Try Groq if API key is set
    if (GROQ_API_KEY) {
        try {
            const reply = await callGroq(message);
            if (reply) return res.json({ reply });
        } catch (err) {
            console.error('Groq API failed, falling back to local:', err.message);
        }
    }

    // 2. Fallback to local smart response
    const localReply = await generateLocalResponse(message);
    res.json({ reply: localReply });
});

module.exports = router;