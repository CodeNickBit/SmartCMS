require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Manager = require('./models/Manager');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const manager = await Manager.findOne({ email: 'atikmanager@gmail.com' }).select('_id name');
  console.log('Manager:', manager._id, manager.name);
  const emails = ['manush@gmail.com', 'chintu@gmail.com', 'shubham@gmail.com'];
  for (const email of emails) {
    const u = await User.findOne({ email }).select('_id firstName lastName email reportingManager');
    console.log(u ? `${u.email} → ${u._id} | manager: ${u.reportingManager}` : `NOT FOUND: ${email}`);
  }
  await mongoose.disconnect();
});
