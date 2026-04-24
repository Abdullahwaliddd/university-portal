const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const studentRoutes = require('./routes/students');
const universityRoutes = require('./routes/universities');
const applicationRoutes = require('./routes/applications');
const majorRoutes = require('./routes/majors');
const courseRoutes = require('./routes/courses');
const collegeRoutes = require('./routes/colleges');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/colleges', collegeRoutes);

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('=========================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
    console.log('=========================================');
});