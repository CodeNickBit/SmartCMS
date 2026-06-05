require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Manager = require('./models/Manager');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const u = await User.findOne({ firstName: /shrey/i }).select('_id firstName lastName email reportingManager');
  console.log('User:', u);
  if (u?.reportingManager) {
    const m = await Manager.findById(u.reportingManager).select('name email _id');
    console.log('Manager:', m);
  }
  await mongoose.disconnect();
});
