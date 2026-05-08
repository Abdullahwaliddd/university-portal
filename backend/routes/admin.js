const express = require('express');
const router = express.Router();
const db = require('../db');

// --------------------- AUTH ---------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query(
            'SELECT * FROM admin WHERE email = ? AND password = ?',
            [email, password]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid admin credentials' });
        res.json({ admin: rows[0], message: 'Admin login successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --------------------- STATS ---------------------
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

// --------------------- STUDENTS ---------------------
router.get('/students', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM student ORDER BY Student_ID DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/students/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM student WHERE Student_ID = ?', [req.params.id]);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --------------------- APPLICATIONS ---------------------
router.get('/applications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, s.First_Name, s.Last_Name, s.Email as Student_Email,
                   m.Name as Major_Name, u.Name as University_Name
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

router.put('/applications/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE application SET Status = ? WHERE Application_ID = ?', [status, req.params.id]);
        res.json({ message: 'Application status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/applications/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM application WHERE Application_ID = ?', [req.params.id]);
        res.json({ message: 'Application deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --------------------- UNIVERSITIES (CRUD) ---------------------
router.get('/universities', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM university ORDER BY University_ID');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/universities', async (req, res) => {
    try {
        const { Name, Type, Location, Email, Phone, Website } = req.body;
        const [result] = await db.query(
            'INSERT INTO university (Name, Type, Location, Email, Phone, Website) VALUES (?, ?, ?, ?, ?, ?)',
            [Name, Type, Location, Email, Phone, Website]
        );
        res.status(201).json({ id: result.insertId, message: 'University added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/universities/:id', async (req, res) => {
    try {
        const { Name, Type, Location, Email, Phone, Website } = req.body;
        await db.query(
            'UPDATE university SET Name=?, Type=?, Location=?, Email=?, Phone=?, Website=? WHERE University_ID=?',
            [Name, Type, Location, Email, Phone, Website, req.params.id]
        );
        res.json({ message: 'University updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/universities/:id', async (req, res) => {
    try {
        // Delete related records first (cascade manually if needed)
        await db.query('DELETE FROM university WHERE University_ID = ?', [req.params.id]);
        res.json({ message: 'University deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --------------------- MAJORS (CRUD) ---------------------
router.get('/majors', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, c.Name as College_Name, u.Name as University_Name, u.University_ID
            FROM major m 
            JOIN college c ON m.College_ID = c.College_ID 
            JOIN university u ON c.University_ID = u.University_ID
            ORDER BY m.Major_ID
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/majors', async (req, res) => {
    try {
        const { Name, Degree_Type, Duration_Years, Description, College_ID } = req.body;
        const [result] = await db.query(
            'INSERT INTO major (Name, Degree_Type, Duration_Years, Description, College_ID) VALUES (?, ?, ?, ?, ?)',
            [Name, Degree_Type, Duration_Years, Description, College_ID]
        );
        res.status(201).json({ id: result.insertId, message: 'Major added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/majors/:id', async (req, res) => {
    try {
        const { Name, Degree_Type, Duration_Years, Description, College_ID } = req.body;
        await db.query(
            'UPDATE major SET Name=?, Degree_Type=?, Duration_Years=?, Description=?, College_ID=? WHERE Major_ID=?',
            [Name, Degree_Type, Duration_Years, Description, College_ID, req.params.id]
        );
        res.json({ message: 'Major updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/majors/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM major WHERE Major_ID = ?', [req.params.id]);
        res.json({ message: 'Major deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --------------------- COLLEGES (for dropdown) ---------------------
router.get('/colleges', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, u.Name as University_Name 
            FROM college c 
            JOIN university u ON c.University_ID = u.University_ID
            ORDER BY c.College_ID
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'frontend', 'images'));
    },
    filename: (req, file, cb) => {
        const uniId = req.params.id;
        cb(null, `uni-${uniId}.jpg`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Upload photo for a university
router.post('/universities/:id/photo', upload.single('photo'), async (req, res) => {
    try {
        // The file is saved. Update the university record with the path.
        const photoPath = `/images/uni-${req.params.id}.jpg`;
        await db.query('UPDATE university SET photo = ? WHERE University_ID = ?', [photoPath, req.params.id]);
        res.json({ message: 'Photo uploaded successfully', path: photoPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});// --------------------- STUDY PLANS & COURSES ---------------------
// Get all study plans with related info
router.get('/studyplans', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT sp.*, m.Name as Major_Name, u.Name as University_Name
            FROM study_plan sp
            JOIN major m ON sp.Major_ID = m.Major_ID
            JOIN college c ON m.College_ID = c.College_ID
            JOIN university u ON c.University_ID = u.University_ID
            ORDER BY sp.Plan_ID
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get courses for a specific plan
router.get('/studyplans/:planId/courses', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM course WHERE Plan_ID = ? ORDER BY Semester_No', [req.params.planId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a course to a plan
router.post('/studyplans/:planId/courses', async (req, res) => {
    try {
        const { Course_Code, Course_Name, Credit_Hours, Semester_No, Level } = req.body;
        const [result] = await db.query(
            'INSERT INTO course (Course_Code, Course_Name, Credit_Hours, Semester_No, Level, Plan_ID) VALUES (?, ?, ?, ?, ?, ?)',
            [Course_Code, Course_Name, Credit_Hours, Semester_No, Level, req.params.planId]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a course
router.delete('/courses/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM course WHERE Course_ID = ?', [req.params.id]);
        res.json({ message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});