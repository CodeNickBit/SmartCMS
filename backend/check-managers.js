require('dotenv').config();
const mongoose = require('mongoose');
const Manager = require('./models/Manager');

async function checkManagers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const managers = await Manager.find({});
    console.log(`Total Managers: ${managers.length}\n`);

    if (managers.length === 0) {
      console.log('❌ No managers found in database');
    } else {
      console.log('=== ALL MANAGERS ===');
      managers.forEach(m => {
        console.log(`Name: ${m.name}`);
        console.log(`Email: ${m.email}`);
        console.log(`Department: ${m.department}`);
        console.log(`Designation: ${m.designation}`);
        console.log(`Active: ${m.isActive}`);
        console.log(`ID: ${m._id}\n`);
      });

      const activeManagers = managers.filter(m => m.isActive);
      console.log(`Active Managers: ${activeManagers.length}`);
      
      const byDept = {};
      activeManagers.forEach(m => {
        if (!byDept[m.department]) byDept[m.department] = [];
        byDept[m.department].push(m.name);
      });
      
      console.log('\n=== BY DEPARTMENT ===');
      Object.keys(byDept).forEach(dept => {
        console.log(`${dept}: ${byDept[dept].join(', ')}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkManagers();
