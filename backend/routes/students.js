const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

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

// Create new student (with password & email validation)
router.post('/', async (req, res) => {
    try {
        const { First_Name, Last_Name, Gender, Date_of_Birth, National_ID, Email, Phone, Address, Password } = req.body;

        if (!Password || Password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const [existing] = await db.query('SELECT Student_ID FROM student WHERE Email = ?', [Email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'This email is already registered' });
        }

        const [result] = await db.query(
            'INSERT INTO student (First_Name, Last_Name, Gender, Date_of_Birth, National_ID, Email, Phone, Address, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [First_Name, Last_Name, Gender, Date_of_Birth, National_ID, Email, Phone, Address, Password]
        );
        res.status(201).json({ id: result.insertId, message: 'Student created successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This email is already registered' });
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

// ---------- Email Verification ----------
router.post('/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const [existing] = await db.query('SELECT Student_ID FROM student WHERE Email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email credentials missing');
            return res.status(500).json({ error: 'Email service not configured.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000);

        await db.query('DELETE FROM email_verification WHERE email = ?', [email]);
        await db.query('INSERT INTO email_verification (email, code, expires_at) VALUES (?, ?, ?)', [email, code, expiresAt]);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: `"EduFuture" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your EduFuture Verification Code',
            html: `<h3>Your verification code is: <strong>${code}</strong></h3><p>This code expires in 10 minutes.</p>`
        });

        res.json({ message: 'Verification code sent' });
    } catch (error) {
        console.error('Send-code error:', error);
        res.status(500).json({ error: 'Failed to send verification code.' });
    }
});

router.post('/verify-and-register', async (req, res) => {
    const { email, code, ...studentData } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

    try {
        const [verifications] = await db.query(
            'SELECT * FROM email_verification WHERE email = ? AND code = ? AND expires_at > NOW() AND used = 0',
            [email, code]
        );
        if (verifications.length === 0) return res.status(400).json({ error: 'Invalid or expired code' });

        await db.query('UPDATE email_verification SET used = 1 WHERE id = ?', [verifications[0].id]);

        if (!studentData.Password || studentData.Password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const [result] = await db.query(
            'INSERT INTO student (First_Name, Last_Name, Gender, Date_of_Birth, National_ID, Email, Phone, Address, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [studentData.First_Name, studentData.Last_Name, studentData.Gender, studentData.Date_of_Birth, studentData.National_ID, email, studentData.Phone, studentData.Address, studentData.Password]
        );
        res.status(201).json({ id: result.insertId, message: 'Registration successful' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
        console.error('Verify-and-register error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;