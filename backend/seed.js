const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Manager = require('./models/Manager');
const Hr = require('./models/Hr');
const Admin = require('./models/Admin');

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Employees
    const employeesData = [
      { email: 'manush@gmail.com', pass: 'manush@111' },
      { email: 'chintu@gmail.com', pass: 'chintu@111' },
      { email: 'subham@gmail.com', pass: 'subham@111' },
      { email: 'gopal@gmail.com', pass: 'gopal@111' },
      { email: 'meet@gmail.com', pass: 'meet@111' },
      { email: 'hir@gmail.com', pass: 'hir@111' }
    ];

    for (const data of employeesData) {
      const exists = await User.findOne({ email: data.email });
      if (!exists) {
        const namePart = data.email.split('@')[0];
        const user = new User({
          firstName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
          lastName: 'Doe',
          email: data.email,
          password: data.pass,
          gender: 'Male',
          dateOfBirth: new Date('1990-01-01'),
          age: 30,
          phone: '1234567890',
          currentAddress: 'Test Address',
          permanentAddress: 'Test Address',
          emergencyContactName: 'Test Contact',
          emergencyContactNumber: '1234567890',
          employeeId: 'EMP' + Math.floor(Math.random() * 1000000),
          department: 'Engineering',
          designation: 'Engineer',
          joiningDate: new Date(),
          employmentType: 'full-time',
          workLocation: 'HQ',
          role: 'employee'
        });
        await user.save({ validateBeforeSave: false });
        console.log('Created Employee:', data.email);
      } else {
        console.log('Employee exists:', data.email);
      }
    }

    // Managers
    const managersData = [
      { email: 'atikmanager@gmail.com', pass: 'atikmanager@111' },
      { email: 'jd@gmail.com', pass: 'jd@111' },
      { email: 'urivakadhar@gmail.com', pass: 'urivakadhar@111' },
      { email: 'virendra@gmail.com', pass: 'virendra@111' }
    ];

    for (const data of managersData) {
      const exists = await Manager.findOne({ email: data.email });
      if (!exists) {
        const namePart = data.email.split('@')[0];
        const manager = new Manager({
          name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
          email: data.email,
          temporaryPassword: data.pass,
          department: 'Engineering',
          designation: 'Manager'
        });
        await manager.save({ validateBeforeSave: false });
        console.log('Created Manager:', data.email);
      } else {
        console.log('Manager exists:', data.email);
      }
    }

    // HR
    const hrData = [
      { email: 'kysp@gmail.com', pass: 'ksyphr@111' },
      { email: 'alok@gmail.com', pass: 'alok@111' },
      { email: 'manish@gmail.com', pass: 'manish@111' }
    ];

    for (const data of hrData) {
      const exists = await Hr.findOne({ email: data.email });
      if (!exists) {
        const namePart = data.email.split('@')[0];
        const hr = new Hr({
          name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
          email: data.email,
          password: data.pass
        });
        await hr.save({ validateBeforeSave: false });
        console.log('Created HR:', data.email);
      } else {
        console.log('HR exists:', data.email);
      }
    }

    // Admin
    const adminData = [
      { email: 'steve26@admin.com', pass: 'steve26@111' }
    ];

    for (const data of adminData) {
      const exists = await Admin.findOne({ email: data.email });
      if (!exists) {
        const admin = new Admin({
          name: 'Steve Admin',
          email: data.email,
          password: data.pass
        });
        await admin.save({ validateBeforeSave: false });
        console.log('Created Admin:', data.email);
      } else {
        console.log('Admin exists:', data.email);
      }
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

start();
