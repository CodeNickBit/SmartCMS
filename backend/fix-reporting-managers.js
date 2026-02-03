require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Manager = require('./models/Manager');

async function fixReportingManagers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const managers = await Manager.find({});
    console.log('Available Managers:');
    managers.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name} (${m.email}) - ID: ${m._id}`);
    });

    console.log('\n=== FIXING REPORTING MANAGERS ===\n');

    const employees = await User.find({});
    
    for (const emp of employees) {
      const oldManager = emp.reportingManager;
      
      if (!oldManager || oldManager === 'NONE') {
        console.log(`⏭️  Skipping ${emp.firstName} ${emp.lastName} - no manager set`);
        continue;
      }

      let matchedManager = managers.find(m => 
        m._id.toString() === oldManager ||
        m.name === oldManager ||
        m.email === oldManager ||
        m.name.toLowerCase() === oldManager.toLowerCase()
      );

      if (matchedManager) {
        emp.reportingManager = matchedManager.name;
        try {
          await emp.save({ validateModifiedOnly: true });
          console.log(`✅ ${emp.firstName} ${emp.lastName}: "${oldManager}" → "${matchedManager.name}"`);
        } catch (saveError) {
          console.log(`❌ ${emp.firstName} ${emp.lastName}: Failed to save - ${saveError.message}`);
        }
      } else {
        console.log(`⚠️  ${emp.firstName} ${emp.lastName}: No match found for "${oldManager}"`);
      }
    }

    console.log('\n✅ Done! Run debug-attendance.js again to verify.');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixReportingManagers();
