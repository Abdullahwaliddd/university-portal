const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all majors
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, c.Name as College_Name, u.Name as University_Name 
            FROM major m 
            JOIN college c ON m.College_ID = c.College_ID 
            JOIN university u ON c.University_ID = u.University_ID
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get major by ID with study plan and courses
router.get('/:id', async (req, res) => {
    try {
        const [major] = await db.query('SELECT * FROM major WHERE Major_ID = ?', [req.params.id]);
        if (major.length === 0) return res.status(404).json({ error: 'Major not found' });
        
        const [studyPlans] = await db.query('SELECT * FROM study_plan WHERE Major_ID = ?', [req.params.id]);
        
        for (let plan of studyPlans) {
            const [courses] = await db.query('SELECT * FROM course WHERE Plan_ID = ?', [plan.Plan_ID]);
            plan.courses = courses;
        }
        
        const [fees] = await db.query('SELECT * FROM fee WHERE Major_ID = ?', [req.params.id]);
        
        res.json({ ...major[0], studyPlans, fees });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search majors
router.get('/search/:query', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM major WHERE Name LIKE ? OR Description LIKE ?',
            [`%${req.params.query}%`, `%${req.params.query}%`]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;