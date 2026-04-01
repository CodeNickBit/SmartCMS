require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'SmartCMS API is running' });
});

// Import routes
const authRoutes = require('./routes/auth');
const managerRoutes = require('./routes/manager');
const hrRoutes = require('./routes/hr');
const departmentRoutes = require('./routes/department');
const designationRoutes = require('./routes/designation');
const officeLocationRoutes = require('./routes/officeLocation');
const attendanceRoutes = require('./routes/attendance');
const projectRoutes = require('./routes/project');
const taskRoutes = require('./routes/task');

app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/designation', designationRoutes);
app.use('/api/leave-policy', require('./routes/leavePolicy'));
app.use('/api/leave', require('./routes/leaveRoutes'));
app.use('/api/office-locations', officeLocationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);

// Handle 404 routes with JSON response
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
