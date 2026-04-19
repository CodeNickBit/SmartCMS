require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({ firstName: /shubh/i }).select('firstName lastName email reportingManager');
  console.log('Found:', users.length);
  users.forEach(u => console.log(u.email, u.firstName, u.lastName, u.reportingManager));
  await mongoose.disconnect();
});
