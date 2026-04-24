const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all colleges
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, u.Name as University_Name 
            FROM college c 
            JOIN university u ON c.University_ID = u.University_ID
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
