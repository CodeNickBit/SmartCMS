const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';

async function fixData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create Atik if he doesn't exist
        let atik = await User.findOne({ email: 'atikmanager@gmail.com' });

        if (!atik) {
            console.log('Creating Manager Atik...');
            atik = new User({
                firstName: 'Atik',
                lastName: 'Manager',
                email: 'atikmanager@gmail.com',
                password: 'password123',
                role: 'manager',
                phone: '9876543210',
                dateOfBirth: new Date('1990-01-01'),
                age: 35,
                gender: 'Male',
                currentAddress: '123 Manager St',
                permanentAddress: '123 Manager St',
                emergencyContactName: 'Emergency',
                emergencyContactNumber: '9876543210',
                employeeId: 'EMP-ATIK',
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
            await atik.save();
            console.log('Manager Atik created:', atik._id);
        } else {
            console.log('Manager Atik already exists:', atik._id);
        }

        // 2. Link Shrey to Atik
        const shrey = await User.findOne({ email: 'shrey@gmail.com' });
        if (shrey) {
            // Set reporting manager to Atik's _id or employeeId. 
            // The frontend/backend logic seems to rely on what stored in 'managerId' of leave request.
            // leaveController.js uses `managerId: user.reportingManager`.
            // The shared dashboard leave requests likely use the logged in user's ID.
            // So we must store Atik's _id in Shrey's reportingManager field.
            // Note: User model has _id as String (custom generated).

            const managerIdToLink = atik._id; // Using the helper-generated string ID

            shrey.reportingManager = managerIdToLink;
            await shrey.save();
            console.log(`Updated Shrey's reporting manager to: ${managerIdToLink}`);

            // 3. Fix existing leave requests for Shrey
            // Find leaves where userId is Shrey and managerId is NOT Atik's ID
            const res = await LeaveRequest.updateMany(
                { userId: shrey._id },
                { managerId: managerIdToLink }
            );
            console.log(`Updated ${res.modifiedCount} leave requests to point to new manager.`);

        } else {
            console.log('User Shrey not found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

fixData();
