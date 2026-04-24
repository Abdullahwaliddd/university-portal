const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all universities
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM university');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get university by ID with colleges and majors
router.get('/:id', async (req, res) => {
    try {
        const [university] = await db.query('SELECT * FROM university WHERE University_ID = ?', [req.params.id]);
        if (university.length === 0) return res.status(404).json({ error: 'University not found' });
        
        const [colleges] = await db.query('SELECT * FROM college WHERE University_ID = ?', [req.params.id]);
        
        // Get majors for each college
        for (let college of colleges) {
            const [majors] = await db.query('SELECT * FROM major WHERE College_ID = ?', [college.College_ID]);
            college.majors = majors;
        }
        
        res.json({ ...university[0], colleges });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;