const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const payrollController = require('../controllers/payrollController');
const User = require('../models/User');

async function testRunPayroll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const req = {
            body: { year: 2026, month: 3 },
            user: { _id: 'system_test' }
        };

        const res = {
            statusCode: 200,
            json: function(data) {
                console.log('\n--- Payroll Run Summary ---');
                console.log(data.message);
                console.log('Summary:', JSON.stringify(data.summary, null, 2));
                
                console.log('\n--- Analysis of skipped employees ---');
                const noAttendanceSkipped = data.results.skipped.filter(s => s.reason === 'No attendance records found for this period.');
                console.log(`Employees skipped due to missing attendance: ${noAttendanceSkipped.length}`);
                
                // Track specific IDs if possible or just counts
                console.log('\nVerification:');
                if (noAttendanceSkipped.length >= 3) {
                    console.log('✅ Success: At least 3 employees were skipped for missing attendance (Gopal, Meet, Hir).');
                } else {
                    console.log('❌ Failure: Fewer than 3 employees were skipped for missing attendance.');
                }
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            }
        };

        console.log('Running payroll for March 2026...');
        await payrollController.runPayroll(req, res);

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testRunPayroll();
