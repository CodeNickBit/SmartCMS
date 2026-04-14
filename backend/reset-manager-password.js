require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Manager = require('./models/Manager');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';

async function resetPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'bhoothnath@gmail.com';
    const newPassword = 'bhoothnath123';

    const manager = await Manager.findOne({ email });
    
    if (!manager) {
      console.log('Manager not found!');
      await mongoose.disconnect();
      return;
    }

    console.log('\nManager found:');
    console.log('Name:', manager.name);
    console.log('Email:', manager.email);
    console.log('Department:', manager.department);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    manager.temporaryPassword = hashedPassword;
    manager.isPasswordChanged = false;
    await manager.save();

    console.log('\n✅ Password reset successfully!');
    console.log('\nNew Login Credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('\nNote: User will be prompted to change password on first login.');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
