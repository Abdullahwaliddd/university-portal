const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all applications
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, s.First_Name, s.Last_Name, m.Name as Major_Name, u.Name as University_Name 
            FROM application a 
            JOIN student s ON a.Student_ID = s.Student_ID 
            JOIN major m ON a.Major_ID = m.Major_ID 
            JOIN college c ON m.College_ID = c.College_ID 
            JOIN university u ON c.University_ID = u.University_ID
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new application
router.post('/', async (req, res) => {
    try {
        const { Student_ID, Major_ID, GPA, High_School_Score } = req.body;
        const [result] = await db.query(
            'INSERT INTO application (Application_Date, Status, GPA, High_School_Score, Student_ID, Major_ID) VALUES (CURDATE(), "Pending", ?, ?, ?, ?)',
            [GPA, High_School_Score, Student_ID, Major_ID]
        );
        res.status(201).json({ id: result.insertId, message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update application status
router.put('/:id/status', async (req, res) => {
    try {
        const { Status } = req.body;
        await db.query('UPDATE application SET Status = ? WHERE Application_ID = ?', [Status, req.params.id]);
        res.json({ message: 'Application status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete application
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM application WHERE Application_ID = ?', [req.params.id]);
        res.json({ message: 'Application deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;