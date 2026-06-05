const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Manager = require('./models/Manager');
const Hr = require('./models/Hr');
const SalaryTemplate = require('./models/SalaryTemplate');

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for scrambling');

    // Fetch Salary Templates to get their IDs
    const templates = await SalaryTemplate.find({});
    const templateMap = {
      'Junior': templates.find(t => t.name === 'Junior Engineer Band')?._id,
      'Senior': templates.find(t => t.name === 'Senior Engineer Band')?._id,
      'Manager': templates.find(t => t.name === 'Manager Band')?._id,
      'HR': templates.find(t => t.name === 'HR Band')?._id
    };

    const rolesConfigs = [
      { dep: 'Engineering', desig: 'Software Engineer', tpl: 'Junior' },
      { dep: 'Engineering', desig: 'Senior Software Engineer', tpl: 'Senior' },
      { dep: 'Engineering', desig: 'Team Lead', tpl: 'Manager' },
      { dep: 'Human Resources', desig: 'HR Executive', tpl: 'HR' },
      { dep: 'Sales', desig: 'Sales Executive', tpl: 'Junior' },
      { dep: 'Finance', desig: 'Accountant', tpl: 'Junior' },
      { dep: 'Customer Support', desig: 'Support Engineer', tpl: 'Junior' }
    ];

    const managerConfigs = [
      { dep: 'Engineering', desig: 'Engineering Manager', tpl: 'Manager' },
      { dep: 'Sales', desig: 'Sales Manager', tpl: 'Manager' },
      { dep: 'Marketing', desig: 'Marketing Manager', tpl: 'Manager' },
      { dep: 'Human Resources', desig: 'HR Manager', tpl: 'Manager' }
    ];

    // Get all users
    const users = await User.find({ role: 'employee' });
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const conf = rolesConfigs[i % rolesConfigs.length];
      
      user.department = conf.dep;
      user.designation = conf.desig;
      if (templateMap[conf.tpl]) {
        user.salaryTemplate = templateMap[conf.tpl];
      }
      
      const middleNames = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles'];
      user.middleName = middleNames[i % middleNames.length];
      
      // Make unique
      user.phone = `987654${String(i).padStart(4, '0')}`;
      user.emergencyContactNumber = `123456${String(i).padStart(4, '0')}`;
      user.emergencyContactName = `Contact ${user.firstName}`;
      user.currentAddress = `${i}12 Test Street, City`;
      user.permanentAddress = `${i}34 Backup Ave, City`;
      
      const dob = new Date('1990-01-01');
      dob.setFullYear(1985 + (i % 10));
      dob.setMonth((i * 3) % 12);
      user.dateOfBirth = dob;
      
      await user.save({ validateBeforeSave: false });
    }
    console.log(`Updated ${users.length} Employees`);

    const managers = await Manager.find({});
    for (let i = 0; i < managers.length; i++) {
        const mgr = managers[i];
        const conf = managerConfigs[i % managerConfigs.length];
        mgr.department = conf.dep;
        mgr.designation = conf.desig;
        await mgr.save({ validateBeforeSave: false });
    }
    console.log(`Updated ${managers.length} Managers`);

    const hrs = await Hr.find({});
    for (let i = 0; i < hrs.length; i++) {
        const hr = hrs[i];
        // HR usually stays in Human Resources
        hr.department = 'Human Resources';
        await hr.save({ validateBeforeSave: false });
    }
    console.log(`Updated ${hrs.length} HRs`);

    console.log('Scrambling and mapping complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
start();
