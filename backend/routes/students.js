const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all students
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM student');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM student WHERE Student_ID = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new student
router.post('/', async (req, res) => {
    try {
        const { First_Name, Last_Name, Gender, Date_of_Birth, National_ID, Email, Phone, Address, Password } = req.body;
        const [result] = await db.query(
            'INSERT INTO student (First_Name, Last_Name, Gender, Date_of_Birth, National_ID, Email, Phone, Address, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [First_Name, Last_Name, Gender, Date_of_Birth, National_ID, Email, Phone, Address, Password || '123']
        );
        res.status(201).json({ id: result.insertId, message: 'Student created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update student
router.put('/:id', async (req, res) => {
    try {
        const { First_Name, Last_Name, Gender, Date_of_Birth, Email, Phone, Address } = req.body;
        await db.query(
            'UPDATE student SET First_Name = ?, Last_Name = ?, Gender = ?, Date_of_Birth = ?, Email = ?, Phone = ?, Address = ? WHERE Student_ID = ?',
            [First_Name, Last_Name, Gender, Date_of_Birth, Email, Phone, Address, req.params.id]
        );
        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM student WHERE Student_ID = ?', [req.params.id]);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Student login
router.post('/login', async (req, res) => {
    try {
        const { Email, Password } = req.body;
        const [rows] = await db.query('SELECT * FROM student WHERE Email = ? AND Password = ?', [Email, Password]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ student: rows[0], message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student applications
router.get('/:id/applications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, m.Name as Major_Name, u.Name as University_Name 
            FROM application a 
            JOIN major m ON a.Major_ID = m.Major_ID 
            JOIN college c ON m.College_ID = c.College_ID 
            JOIN university u ON c.University_ID = u.University_ID 
            WHERE a.Student_ID = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;