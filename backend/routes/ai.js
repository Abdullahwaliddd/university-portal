const express = require('express');
const router = express.Router();
const db = require('../db');

// NEVER hardcode the key. It MUST come from Railway's environment variables.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post('/chat', async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ reply: "AI service is not configured. Please set the GEMINI_API_KEY environment variable." });
    }

    try {
        const { message } = req.body;

        // Build context from your real database
        const [universities] = await db.query('SELECT Name, Location, Type, Website FROM university');
        const [majors] = await db.query(
            `SELECT m.Name, m.Degree_Type, m.Duration_Years, c.Name as College, u.Name as University 
             FROM major m 
             JOIN college c ON m.College_ID = c.College_ID 
             JOIN university u ON c.University_ID = u.University_ID`
        );

        const context = `
You are EduFuture Assistant, a helpful AI for a university admission platform in Egypt.
You help students find programs, understand admissions, and navigate the platform.

Here is the real data from the platform:

Universities:
${universities.map(u => `- ${u.Name} (${u.Location}), Type: ${u.Type}, Website: ${u.Website}`).join('\n')}

Majors/Programs:
${majors.slice(0, 20).map(m => `- ${m.Name} (${m.Degree_Type}, ${m.Duration_Years} years) at ${m.University} in ${m.College}`).join('\n')}

Answer the student's question using this data. Keep answers concise, friendly, and helpful.
If the question is outside this domain, politely redirect to university topics.
`.trim();

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${context}\n\nStudent: ${message}\nAssistant:` }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500
                    }
                })
            }
        );

        const data = await response.json();
        console.log('Gemini API Response:', JSON.stringify(data));
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      "I'm having trouble answering that right now. Please try again!";

        res.json({ reply });

    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ reply: "Oops! Something went wrong. Please try again later." });
    }
});

module.exports = router;