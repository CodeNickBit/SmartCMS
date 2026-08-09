require('dotenv').config();
const mongoose = require('mongoose');
const Manager = require('./models/Manager');
const Department = require('./models/Department');

async function testDepartmentCase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=== DEPARTMENTS IN DATABASE ===');
    const departments = await Department.find({});
    departments.forEach(d => {
      console.log(`Name: "${d.name}" | ID: ${d._id}`);
    });

    console.log('\n=== MANAGERS IN DATABASE ===');
    const managers = await Manager.find({ isActive: true });
    managers.forEach(m => {
      console.log(`Name: ${m.name} | Department: "${m.department}"`);
    });

    console.log('\n=== TESTING EXACT MATCH ===');
    const testDept = 'IT';
    console.log(`Searching for department: "${testDept}"`);
    const exactMatch = await Manager.find({ isActive: true, department: testDept });
    console.log(`Found ${exactMatch.length} managers`);
    exactMatch.forEach(m => console.log(`  - ${m.name}`));

    console.log('\n=== TESTING CASE-INSENSITIVE MATCH ===');
    const testDept2 = 'it';
    console.log(`Searching for department: "${testDept2}"`);
    const caseInsensitive = await Manager.find({ 
      isActive: true, 
      department: { $regex: new RegExp(`^${testDept2}$`, 'i') }
    });
    console.log(`Found ${caseInsensitive.length} managers`);
    caseInsensitive.forEach(m => console.log(`  - ${m.name}`));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDepartmentCase();
