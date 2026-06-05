require('dotenv').config();
const mongoose = require('mongoose');
const Manager = require('./models/Manager');

async function testFilter() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=== TEST 1: All Active Managers ===');
    const allActive = await Manager.find({ isActive: true })
      .select('_id name email department designation')
      .sort({ name: 1 });
    console.log(`Found: ${allActive.length} managers`);
    allActive.forEach(m => console.log(`  - ${m.name} (${m.department})`));

    console.log('\n=== TEST 2: IT Department Only ===');
    const itManagers = await Manager.find({ isActive: true, department: 'IT' })
      .select('_id name email department designation')
      .sort({ name: 1 });
    console.log(`Found: ${itManagers.length} managers`);
    itManagers.forEach(m => console.log(`  - ${m.name} (${m.department})`));

    console.log('\n=== TEST 3: Marketing Department Only ===');
    const marketingManagers = await Manager.find({ isActive: true, department: 'marketing' })
      .select('_id name email department designation')
      .sort({ name: 1 });
    console.log(`Found: ${marketingManagers.length} managers`);
    marketingManagers.forEach(m => console.log(`  - ${m.name} (${m.department})`));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFilter();
