require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function fixAdminRole() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const adminDoc = await Admin.findOneAndUpdate(
    { email: 'rajesh.khanna@nexacore.in' },
    { role: 'admin' },
    { new: true }
  );
  
  if (adminDoc) {
    console.log('Admin role updated to:', adminDoc.role);
  } else {
    console.log('Admin NOT found!');
  }

  await mongoose.disconnect();
  console.log('Done!');
}

fixAdminRole().catch(err => {
  console.error('Fix failed:', err.message);
  process.exit(1);
});
