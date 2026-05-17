const express = require('express');
const router = express.Router();
const db = require('../db');

// University Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query(
            'SELECT * FROM university_admins WHERE email = ? AND password = ?',
            [email, password]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ admin: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get applications for this university
router.get('/applications', async (req, res) => {
    try {
        const uniId = req.headers['x-university-id'];
        if (!uniId) return res.status(400).json({ error: 'University ID required' });
        const [apps] = await db.query(`
            SELECT a.*, s.First_Name, s.Last_Name, s.Email as Student_Email, m.Name as Major_Name
            FROM application a
            JOIN student s ON a.Student_ID = s.Student_ID
            JOIN major m ON a.Major_ID = m.Major_ID
            JOIN college c ON m.College_ID = c.College_ID
            WHERE c.University_ID = ?
            ORDER BY a.Application_ID DESC
        `, [uniId]);
        res.json(apps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update application status
router.put('/applications/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const uniId = req.headers['x-university-id'];
        // Verify the application belongs to this university
        const [app] = await db.query(`
            SELECT a.Application_ID FROM application a
            JOIN major m ON a.Major_ID = m.Major_ID
            JOIN college c ON m.College_ID = c.College_ID
            WHERE a.Application_ID = ? AND c.University_ID = ?
        `, [req.params.id, uniId]);
        if (app.length === 0) return res.status(403).json({ error: 'Not authorized' });
        await db.query('UPDATE application SET Status = ? WHERE Application_ID = ?', [status, req.params.id]);
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;