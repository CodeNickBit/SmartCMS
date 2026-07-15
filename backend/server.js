require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const markAbsentEmployees = require('./jobs/markAbsent');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    cron.schedule('30 19 * * *', markAbsentEmployees, { timezone: 'Asia/Kolkata' });
    console.log('Absent marking cron scheduled at 19:30 IST daily');
  })
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
const payrollRoutes = require('./routes/payroll');
const dashboardRoutes = require('./routes/dashboard');

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
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/workflow-templates', require('./routes/workflowTemplateRoutes'));

// New Asset and Expense routes
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

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
