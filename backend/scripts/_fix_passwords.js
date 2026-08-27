require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Hr = require('../models/Hr');
const Manager = require('../models/Manager');

async function fixPasswords() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // --- Fix Admin ---
  // The seed did Admin.create({ password: hashPw(...) }) which double-hashed.
  // We fix by setting plain-text and letting the pre-save hook hash it once correctly.
  const adminDoc = await Admin.findOne({ email: 'rajesh.khanna@nexacore.in' });
  if (adminDoc) {
    adminDoc.password = 'Admin@1234';
    await adminDoc.save();
    const check = await bcrypt.compare('Admin@1234', (await Admin.findOne({ email: 'rajesh.khanna@nexacore.in' })).password);
    console.log('Admin password fixed. Login valid:', check);
  } else {
    console.log('Admin NOT found!');
  }

  // --- Fix HR ---
  const hrEmails = ['priya.mehta@nexacore.in', 'sunita.rao@nexacore.in'];
  for (const email of hrEmails) {
    const hrDoc = await Hr.findOne({ email });
    if (hrDoc) {
      hrDoc.password = 'Hr@12345';
      await hrDoc.save();
      const check = await bcrypt.compare('Hr@12345', (await Hr.findOne({ email })).password);
      console.log('HR', hrDoc.name, 'password fixed. Login valid:', check);
    } else {
      console.log('HR not found:', email);
    }
  }

  // --- Fix Managers ---
  const managers = await Manager.find({});
  for (const m of managers) {
    m.temporaryPassword = 'Mgr@12345';
    await m.save();
    const fresh = await Manager.findById(m._id);
    const check = await bcrypt.compare('Mgr@12345', fresh.temporaryPassword);
    console.log('Manager', m.name, 'password fixed. Login valid:', check);
  }

  console.log('');
  console.log('========================================');
  console.log('All passwords fixed!');
  console.log('Admin    -> rajesh.khanna@nexacore.in  / Admin@1234');
  console.log('HR       -> priya.mehta@nexacore.in    / Hr@12345');
  console.log('HR       -> sunita.rao@nexacore.in     / Hr@12345');
  console.log('Managers -> <email>@nexacore.in        / Mgr@12345');
  console.log('Employees-> <email>@nexacore.in        / Emp@12345');
  console.log('========================================');

  await mongoose.disconnect();
  console.log('Done!');
}

fixPasswords().catch(err => {
  console.error('Fix failed:', err.message);
  process.exit(1);
});
