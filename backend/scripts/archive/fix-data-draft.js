const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // 1. Create Atik if he doesn't exist
            let atik = await User.findOne({ email: 'atikmanager@gmail.com' });

            if (!atik) {
                console.log('Creating Manager Atik...');
                atik = new User({
                    firstName: 'Atik',
                    lastName: 'Manager',
                    email: 'atikmanager@gmail.com',
                    password: 'password123', // Will be hashed
                    role: 'employee', // Changed to employee but with manager designation? Or is there a 'manager' role?
                    // Looking at Sidebar, roles are 'employee', 'hr', 'manager'. User model has default 'employee'.
                    // Let's set role to 'manager' if valid, checking schema...
                    // User.js schema says enum: ['employee']. Wait.
                    // Let me double check User.js schema in the previous turn.
                    // User.js: role: { type: String, enum: ['employee'], default: 'employee' }
                    // This seems to be a schema limitation. But the sidebar checks for 'manager'.
                    // I should probably override the enum or just set it and hope mongoose doesn't block if I use findOneAndUpdate or if the schema was updated but not my view of it.
                    // Actually, I saw User.js earlier.
                    // Let's look at the schema again.
                    // Line 261: enum: ['employee'],
                    // This is a BUG in User.js schema if it restricts roles.
                    // However, for now I will try to create it. If it fails, I will fix schema.

                    phone: '9876543210',
                    dateOfBirth: new Date('1990-01-01'),
                    age: 35,
                    gender: 'Male',
                    currentAddress: '123 Manager St',
                    permanentAddress: '123 Manager St',
                    emergencyContactName: 'Emergency',
                    emergencyContactNumber: '9876543210',

                    employeeId: 'EMP-ATIK', // Custom
                    department: 'Engineering',
                    designation: 'Manager',
                    joiningDate: new Date(),
                    employmentType: 'full-time',
                    workLocation: 'Remote',

                    // Work/Pay defaults
                    workingHoursStart: '09:00',
                    workingHoursEnd: '18:00',
                    salaryAmount: 100000
                });

                // Hack: Bypass enum validation if needed or assumes schema allows it.
                // Actually, strictly Mongoose will fail. I will check if I should update User.js first.
                // But let's assume the user might have changed it or I missed a line (I saw line 261).
                // Let's stick with 'employee' role but designation 'Manager'? 
                // Sidebar checks `userRole === 'manager'`. 
                // So User.role MUST be 'manager'.
                // I will update the schema in User.js first to be safe.
            }
        } catch (err) {
            console.error(err);
        }
    });
