const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config();

async function checkData() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const chintu = await User.findOne({ email: 'chintu@gmail.com' });
        const atika = await User.findOne({ email: 'atikamanager@gmail.com' });
        // Check also for typos in email as user typed "atikamanger@gmail.com" in prompt
        const atikaTypo = await User.findOne({ email: 'atikamanger@gmail.com' });

        console.log('\n--- Employee: Chintu ---');
        if (chintu) {
            console.log(`ID: ${chintu._id}`);
            console.log(`Email: ${chintu.email}`);
            console.log(`Reporting Manager Field: '${chintu.reportingManager}' (Type: ${typeof chintu.reportingManager})`);
        } else {
            console.log('User chintu@gmail.com not found');
        }

        console.log('\n--- Manager: Atika ---');
        if (atika) {
            console.log(`ID: ${atika._id}`);
            console.log(`Email: ${atika.email}`);
            console.log(`EmployeeID: '${atika.employeeId}'`);
        } else {
            console.log('User atikamanager@gmail.com not found');
        }

        if (atikaTypo) {
            console.log(`\nFound user with typo email 'atikamanger@gmail.com':`);
            console.log(`ID: ${atikaTypo._id}`);
            console.log(`EmployeeID: '${atikaTypo.employeeId}'`);
        }

        const linkedByCode = await User.findOne({ employeeId: '26012933389' });
        console.log('\n--- Search by ID 26012933389 ---');
        if (linkedByCode) {
            console.log(`Found User: ${linkedByCode.firstName} ${linkedByCode.lastName} (${linkedByCode.email})`);
        } else {
            console.log('No user found with employeeId: 26012933389');
        }

    } catch (err) {
        console.error(err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

checkData();
