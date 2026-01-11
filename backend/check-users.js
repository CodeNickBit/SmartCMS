require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./models/User');
    const users = await User.find({}, 'email firstName lastName');
    console.log('Users in DB:', JSON.stringify(users, null, 2));
    mongoose.disconnect();
  })
  .catch(e => console.error(e));
