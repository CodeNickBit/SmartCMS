require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function manualFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('Choose a manager for employees:');
    console.log('1. bhoothnath');
    console.log('2. manager');
    console.log('3. Atik\n');

    const updates = [
      { employeeId: '26012623494', name: 'pikachu Soni', newManager: 'Atik' },
      { employeeId: '26012875740', name: 'Shrey salvi', newManager: 'Atik' }
    ];

    for (const update of updates) {
      const result = await User.updateOne(
        { _id: update.employeeId },
        { $set: { reportingManager: update.newManager } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${update.name} → Manager: ${update.newManager}`);
      } else {
        console.log(`⚠️  ${update.name} - No changes made`);
      }
    }

    console.log('\n✅ Done!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

manualFix();
