const mongoose = require('mongoose');
const User = require('./models/User');
const Manager = require('./models/Manager');
const LeaveRequest = require('./models/LeaveRequest');
const LeavePolicy = require('./models/LeavePolicy');
const leaveController = require('./controllers/leaveController');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartcms';

// Mock Response Object
class MockRes {
    constructor() {
        this.statusCode = null;
        this.body = null;
    }
    status(code) {
        this.statusCode = code;
        return this;
    }
    json(data) {
        this.body = data;
        return this;
    }
}

async function runTests() {
    console.log('--- Connecting to DB ---');
    await mongoose.connect(MONGODB_URI);
    
    try {
        // Create Mock Users
        const managerId = new mongoose.Types.ObjectId();
        const employeeId = new mongoose.Types.ObjectId();

        const baseUserData = {
            gender: 'Male',
            dateOfBirth: new Date('1990-01-01'),
            phone: '1234567890',
            currentAddress: 'Test Addr',
            permanentAddress: 'Test Addr',
            emergencyContactName: 'Test',
            emergencyContactNumber: '1234567890',
            department: 'Test',
            designation: 'Test',
            joiningDate: new Date(),
            employmentType: 'full-time',
            workLocation: 'Test'
        };

        const manager = await User.create({
            ...baseUserData,
            _id: managerId.toString(),
            firstName: 'Test',
            lastName: 'Manager',
            email: `test_manager_${Date.now()}@example.com`,
            password: 'Password123!',
            role: 'manager',
            employeeId: `MGR${Date.now()}`
        });

        // The manager identifier for applyForLeave expects reportingManager to be manager's ID
        await Manager.create({
            _id: managerId.toString(),
            name: 'Test Manager',
            email: manager.email,
            department: 'Test',
            designation: 'Test',
            temporaryPassword: 'Password123!'
        });

        const employee = await User.create({
            ...baseUserData,
            _id: employeeId.toString(),
            firstName: 'Test',
            lastName: 'Employee',
            email: `test_employee_${Date.now()}@example.com`,
            password: 'Password123!',
            role: 'employee',
            employeeId: `EMP${Date.now()}`,
            reportingManager: managerId.toString()
        });

        console.log(`Created Employee: ${employee.email}`);
        console.log(`Created Manager: ${manager.email}`);

        // Ensure Leave Policy Exists
        let policy = await LeavePolicy.findOne({ leaveName: 'Sick Leave' });
        if (!policy) {
            policy = await LeavePolicy.create({
                leaveName: 'Sick Leave',
                description: 'Test Sick Leave',
                allowedRoles: ['employee', 'manager'],
                annualLimit: 12,
                minNoticeHours: 0,
                isActive: true
            });
            console.log('Created Sick Leave policy for testing.');
        }

        console.log('\n--- SCENARIO 1: Create and Reject Leave ---');
        let res1 = new MockRes();
        await leaveController.applyForLeave({
            body: {
                userId: employee._id.toString(),
                leaveType: 'Sick Leave',
                startDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
                reason: 'Feeling unwell',
                leaveUnit: 'full-day'
            }
        }, res1);

        if (res1.statusCode && res1.statusCode !== 201) {
            console.log('Failed to apply for leave:', res1.body);
            return;
        }
        
        const leaveId1 = res1.body._id;
        console.log('Leave applied successfully. ID:', leaveId1);
        
        let res2 = new MockRes();
        await leaveController.updateLeaveStatus({
            params: { id: leaveId1 },
            user: { _id: manager._id },
            body: {
                status: 'Rejected',
                rejectionReason: 'Not enough coverage'
            }
        }, res2);
        
        console.log('Manager Rejected Leave. Updated Status:', res2.body.status, '| Reason:', res2.body.rejectionReason);

        console.log('\n--- SCENARIO 2: Request Changes, Update, and Approve ---');
        let res3 = new MockRes();
        await leaveController.applyForLeave({
            body: {
                userId: employee._id.toString(),
                leaveType: 'Sick Leave',
                startDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 11)).toISOString(),
                reason: 'Doctor appointment',
                leaveUnit: 'full-day'
            }
        }, res3);

        const leaveId2 = res3.body._id;
        console.log('Leave 2 applied. ID:', leaveId2);

        let res4 = new MockRes();
        await leaveController.updateLeaveStatus({
            params: { id: leaveId2 },
            user: { _id: manager._id },
            body: {
                status: 'Changes Requested',
                managerComments: 'Can you change to a half day?'
            }
        }, res4);
        console.log('Manager Requested Changes. Status:', res4.body.status, '| Comments:', res4.body.managerComments);

        let res5 = new MockRes();
        await leaveController.updateLeaveRequest({
            params: { id: leaveId2 },
            body: {
                leaveType: 'Sick Leave',
                startDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
                reason: 'Doctor appointment (half day)',
                leaveUnit: 'half-day',
                halfDayPeriod: 'first-half'
            }
        }, res5);
        console.log('Employee Updated Leave. New Status:', res5.body.status);

        let res6 = new MockRes();
        await leaveController.updateLeaveStatus({
            params: { id: leaveId2 },
            user: { _id: manager._id },
            body: {
                status: 'Approved'
            }
        }, res6);
        console.log('Manager Approved Updated Leave. Final Status:', res6.body.status);

        // Cleanup
        await LeaveRequest.deleteMany({ _id: { $in: [leaveId1, leaveId2] } });
        await User.deleteMany({ _id: { $in: [managerId.toString(), employeeId.toString()] } });
        console.log('\n--- Test cleanup complete ---');

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        mongoose.connection.close();
    }
}
runTests();
