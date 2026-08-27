import os

TARGET = r'd:\Users\Admin\Documents\GitHub\CorporateManagementSystem\SmartCMS\backend\scripts\_restore_manager.js'

CONTENT = r"""require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Manager = require('../models/Manager');

async function restoreManager() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const manager = await Manager.findOneAndUpdate(
    { department: 'Engineering' },
    { isActive: true },
    { new: true }
  );

  if (manager) {
    console.log('Manager restored:', manager.name, manager.email, 'isActive:', manager.isActive);
  } else {
    console.log('Engineering manager not found');
  }

  await mongoose.disconnect();
}
restoreManager().catch(console.error);
"""

with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(CONTENT)

print(f'Fix script written: {os.path.getsize(TARGET)} bytes')
