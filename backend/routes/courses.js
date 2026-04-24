const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all courses
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, sp.Plan_Name, m.Name as Major_Name 
            FROM course c 
            JOIN study_plan sp ON c.Plan_ID = sp.Plan_ID 
            JOIN major m ON sp.Major_ID = m.Major_ID
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get course with prerequisites
router.get('/:id', async (req, res) => {
    try {
        const [course] = await db.query('SELECT * FROM course WHERE Course_ID = ?', [req.params.id]);
        if (course.length === 0) return res.status(404).json({ error: 'Course not found' });
        
        const [prerequisites] = await db.query(`
            SELECT c.* FROM course c 
            JOIN course_prerequisite cp ON c.Course_ID = cp.Prerequisite_Course_ID 
            WHERE cp.Course_ID = ?
        `, [req.params.id]);
        
        res.json({ ...course[0], prerequisites });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;