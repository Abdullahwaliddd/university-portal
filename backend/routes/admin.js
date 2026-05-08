const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query(
            'SELECT * FROM admin WHERE email = ? AND password = ?',
            [email, password]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        
        res.json({ admin: rows[0], message: 'Admin login successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const [universities] = await db.query('SELECT COUNT(*) as count FROM university');
        const [students] = await db.query('SELECT COUNT(*) as count FROM student');
        const [applications] = await db.query('SELECT COUNT(*) as count FROM application');
        const [majors] = await db.query('SELECT COUNT(*) as count FROM major');
        const [colleges] = await db.query('SELECT COUNT(*) as count FROM college');
        const [courses] = await db.query('SELECT COUNT(*) as count FROM course');
        
        res.json({
            universities: universities[0].count,
            students: students[0].count,
            applications: applications[0].count,
            majors: majors[0].count,
            colleges: colleges[0].count,
            courses: courses[0].count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all students
router.get('/students', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM student ORDER BY Student_ID DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM student WHERE Student_ID = ?', [req.params.id]);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all applications
router.get('/applications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, s.First_Name, s.Last_Name, m.Name as Major_Name, u.Name as University_Name 
            FROM application a 
            JOIN student s ON a.Student_ID = s.Student_ID 
            JOIN major m ON a.Major_ID = m.Major_ID 
            JOIN college c ON m.College_ID = c.College_ID 
            JOIN university u ON c.University_ID = u.University_ID
            ORDER BY a.Application_ID DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update application status
router.put('/applications/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE application SET Status = ? WHERE Application_ID = ?', [status, req.params.id]);
        res.json({ message: 'Application updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete application
router.delete('/applications/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM application WHERE Application_ID = ?', [req.params.id]);
        res.json({ message: 'Application deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all universities
router.get('/universities', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM university');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add university
router.post('/universities', async (req, res) => {
    try {
        const { Name, Type, Location, Email, Phone, Website } = req.body;
        const [result] = await db.query(
            'INSERT INTO university (Name, Type, Location, Email, Phone, Website) VALUES (?, ?, ?, ?, ?, ?)',
            [Name, Type, Location, Email, Phone, Website]
        );
        res.json({ id: result.insertId, message: 'University added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete university
router.delete('/universities/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM university WHERE University_ID = ?', [req.params.id]);
        res.json({ message: 'University deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all majors
router.get('/majors', async (req, res) => {
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

// Delete major
router.delete('/majors/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM major WHERE Major_ID = ?', [req.params.id]);
        res.json({ message: 'Major deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;