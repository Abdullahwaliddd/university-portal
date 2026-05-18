const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM university');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [university] = await db.query('SELECT * FROM university WHERE University_ID = ?', [req.params.id]);
        if (university.length === 0) return res.status(404).json({ error: 'University not found' });

        const [colleges] = await db.query('SELECT * FROM college WHERE University_ID = ?', [req.params.id]);

        for (let college of colleges) {
            const [majors] = await db.query('SELECT * FROM major WHERE College_ID = ?', [college.College_ID]);

            for (let major of majors) {
                const [studyPlans] = await db.query('SELECT * FROM study_plan WHERE Major_ID = ?', [major.Major_ID]);

                for (let plan of studyPlans) {
                    const [courses] = await db.query(
                        'SELECT * FROM course WHERE Plan_ID = ? ORDER BY Semester_No, Course_ID',
                        [plan.Plan_ID]
                    );
                    plan.courses = courses;
                }
                major.studyPlans = studyPlans;

                const [fees] = await db.query(
                    'SELECT * FROM fee WHERE Major_ID = ? ORDER BY Academic_Year DESC LIMIT 1',
                    [major.Major_ID]
                );
                major.fees = fees;
            }
            college.majors = majors;
        }

        const [prosCons] = await db.query(
            'SELECT * FROM university_pros_cons WHERE university_id = ?',
            [req.params.id]
        );

        res.json({ ...university[0], colleges, prosCons });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;