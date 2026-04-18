const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

const User = require('./models/User');
const Hr = require('./models/Hr');
const Admin = require('./models/Admin');
const Department = require('./models/Department');

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for phase 2');

        const lastNameMap = {
            'manush@gmail.com': { f: 'Manush', l: 'Doshi' },
            'chintu@gmail.com': { f: 'Chintu', l: 'Barot' },
            'subham@gmail.com': { f: 'Shubham', l: 'Dalvi' },
            'gopal@gmail.com': { f: 'Gopal', l: 'Pandya' },
            'meet@gmail.com': { f: 'Meet', l: 'Patel' },
            'hir@gmail.com': { f: 'Hir', l: 'Shah' }
        };

        for (const [email, names] of Object.entries(lastNameMap)) {
            const user = await User.findOne({ email });
            if (user) {
                user.firstName = names.f;
                user.lastName = names.l;
                await user.save({ validateBeforeSave: false });
            }
        }
        console.log('Updated Employee names.');

        // HRs
        const hrDepartments = ['Human Resources', 'Sales', 'Finance'];
        const hrs = await Hr.find({});
        for (let i = 0; i < hrs.length; i++) {
            const hr = hrs[i];
            hr.department = hrDepartments[i % hrDepartments.length];
            await hr.save({ validateBeforeSave: false });
            // Add a designation field directly in DB to bypass schema strictness, as requested: "also do it same for HRs."
            const desigs = ['HR Manager', 'HR Executive', 'Recruiter'];
            await Hr.collection.updateOne({ _id: hr._id }, { $set: { designation: desigs[i % desigs.length] } });
        }
        console.log('Updated HRs departments and designations.');

        // Admins
        const departments = await Department.find({});
        const allDepNames = departments.map(d => d.name).concat([
            'Engineering', 'Human Resources', 'Sales', 'Marketing', 'Operations', 'Finance', 'Customer Support'
        ]);
        const uniqueDeps = [...new Set(allDepNames)];

        // Assign steve26@admin.com to Engineering
        let steve = await Admin.findOne({ email: 'steve26@admin.com' });
        if (!steve) {
            const salt = await bcrypt.genSalt(10);
            const pass = await bcrypt.hash('steve26@111', salt);
            await Admin.collection.insertOne({
                name: 'Steve Admin',
                email: 'steve26@admin.com',
                password: pass,
                role: 'admin',
                isActive: true,
                department: 'Engineering',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else {
            await Admin.collection.updateOne({ _id: steve._id }, { $set: { department: 'Engineering' } });
        }

        // Delete all unwanted admins except Steve
        await Admin.deleteMany({ email: { $ne: 'steve26@admin.com' } });

        // Create admins for the rest of departments
        const remainingDeps = uniqueDeps.filter(d => d !== 'Engineering');
        for (const dep of remainingDeps) {
            const email = `${dep.toLowerCase().replace(/\s+/g, '')}@admin.com`;
            const salt = await bcrypt.genSalt(10);
            // Default password for new admins
            const pass = await bcrypt.hash('admin@111', salt);
            await Admin.collection.insertOne({
                name: `${dep} Admin`,
                email: email,
                password: pass,
                role: 'admin',
                isActive: true,
                department: dep,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.log('Created admins for each department.');

        console.log('Phase 2 updates complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
start();
