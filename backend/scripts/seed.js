require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('../models/Admin');
const Hr = require('../models/Hr');
const Manager = require('../models/Manager');
const User = require('../models/User');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Asset = require('../models/Asset');
const Expense = require('../models/Expense');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const SalaryComponent = require('../models/SalaryComponent');
const SalaryTemplate = require('../models/SalaryTemplate');
const SalaryRevision = require('../models/SalaryRevision');
const Payslip = require('../models/Payslip');
const WorkflowTemplate = require('../models/WorkflowTemplate');
const Attendance = require('../models/Attendance');

const d = (y, m, day) => new Date(y, m - 1, day);
const hashPw = (pw) => bcrypt.hashSync(pw, 10);
const calcAge = (dob) => {
  const today = new Date(); let age = today.getFullYear() - dob.getFullYear();
  const mo = today.getMonth() - dob.getMonth();
  if (mo < 0 || (mo === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

async function clearAll() {
  console.log('Clearing existing data...');
  await Promise.all([
    Admin.deleteMany({}), Hr.deleteMany({}), Manager.deleteMany({}),
    User.deleteMany({}), Department.deleteMany({}), Designation.deleteMany({}),
    Project.deleteMany({}), Task.deleteMany({}), Asset.deleteMany({}),
    Expense.deleteMany({}), LeavePolicy.deleteMany({}), LeaveBalance.deleteMany({}),
    LeaveRequest.deleteMany({}), SalaryComponent.deleteMany({}),
    SalaryTemplate.deleteMany({}), SalaryRevision.deleteMany({}),
    Payslip.deleteMany({}), WorkflowTemplate.deleteMany({}), Attendance.deleteMany({}),
  ]);
  console.log('All collections cleared.');
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  await clearAll();

  // 1. Admin
  console.log('Seeding Admin...');
  const adminDoc = await Admin.create({
    name: 'Rajesh Khanna',
    email: 'rajesh.khanna@nexacore.in',
    password: 'Admin@1234',
    role: 'admin',
    isActive: true,
    permissions: ['all'],
  });
  console.log('  Admin:', adminDoc.name);

  // 2. Departments
  console.log('Seeding Departments...');
  await Department.insertMany([
    { name: 'Engineering', description: 'Product development, architecture, and software engineering.' },
    { name: 'Human Resources', description: 'Recruitment, employee relations, and people operations.' },
    { name: 'Sales & Marketing', description: 'Revenue generation, brand building, and client acquisition.' },
    { name: 'Finance', description: 'Accounting, budgeting, payroll processing, and financial reporting.' },
    { name: 'Operations', description: 'Day-to-day operational efficiency, logistics, and process management.' },
  ]);

  // 3. Designations
  console.log('Seeding Designations...');
  await Designation.insertMany([
    { title: 'Software Engineer', description: 'Develops and maintains software applications.' },
    { title: 'Senior Software Engineer', description: 'Leads feature development and mentors junior devs.' },
    { title: 'Engineering Manager', description: 'Manages engineering teams and delivery timelines.' },
    { title: 'HR Executive', description: 'Handles recruitment and employee engagement.' },
    { title: 'HR Manager', description: 'Oversees all HR operations and policy.' },
    { title: 'Sales Executive', description: 'Drives direct sales and client outreach.' },
    { title: 'Sales Manager', description: 'Leads the sales team and sets quarterly targets.' },
    { title: 'Financial Analyst', description: 'Analyses financial data and prepares reports.' },
    { title: 'Finance Manager', description: 'Manages budgets and financial planning.' },
    { title: 'Operations Analyst', description: 'Monitors and improves operational processes.' },
    { title: 'Operations Manager', description: 'Leads operational strategy and logistics.' },
    { title: 'UI/UX Designer', description: 'Designs user interfaces and experiences.' },
    { title: 'QA Engineer', description: 'Ensures software quality through testing.' },
    { title: 'DevOps Engineer', description: 'Manages CI/CD pipelines and infrastructure.' },
    { title: 'Product Manager', description: 'Defines product vision and roadmap.' },
  ]);

  // 4. HR Users
  console.log('Seeding HR...');
  const hrDocs = await Hr.create([
    {
      name: 'Priya Mehta', email: 'priya.mehta@nexacore.in', password: 'Hr@12345',
      department: 'Human Resources', isActive: true,
      permissions: { canRegisterEmployees: true, canApproveLeaves: true, canHandlePayroll: true,
        departmentAccess: ['Engineering', 'Sales & Marketing', 'Finance', 'Operations'] },
    },
    {
      name: 'Sunita Rao', email: 'sunita.rao@nexacore.in', password: 'Hr@12345',
      department: 'Human Resources', isActive: true,
      permissions: { canRegisterEmployees: true, canApproveLeaves: true, canHandlePayroll: false,
        departmentAccess: ['Engineering', 'Operations'] },
    },
  ]);

  // 5. Managers
  console.log('Seeding Managers...');
  const mgrRaw = [
    { name: 'Arjun Sharma',  email: 'arjun.sharma@nexacore.in',  department: 'Engineering',      designation: 'Engineering Manager',  joiningDate: d(2023,3,1)  },
    { name: 'Kavya Nair',   email: 'kavya.nair@nexacore.in',    department: 'Sales & Marketing', designation: 'Sales Manager',        joiningDate: d(2023,6,15) },
    { name: 'Suresh Pillai', email: 'suresh.pillai@nexacore.in', department: 'Finance',           designation: 'Finance Manager',      joiningDate: d(2022,11,1) },
    { name: 'Deepak Verma',  email: 'deepak.verma@nexacore.in',  department: 'Operations',        designation: 'Operations Manager',   joiningDate: d(2023,1,20) },
  ];
  const mgrDocs = await Manager.create(mgrRaw.map(m => ({ ...m, temporaryPassword: 'Mgr@12345', isActive: true })));
  const mgr = {};
  mgrDocs.forEach(m => { mgr[m.department] = m; });

  // 6. Salary Components
  console.log('Seeding Salary Components...');
  const compList = await SalaryComponent.insertMany([
    { name: 'Basic Pay',             type: 'earning',   calculationType: 'flat',       amountOrPercentage: 0,   isTaxable: true,  isStatutory: false, isPartOfGross: true,  dependsOnAttendance: true,  createdBy: adminDoc._id.toString() },
    { name: 'House Rent Allowance',  type: 'earning',   calculationType: 'percentage', amountOrPercentage: 40,  isTaxable: false, isStatutory: false, isPartOfGross: true,  dependsOnAttendance: false, createdBy: adminDoc._id.toString() },
    { name: 'Transport Allowance',   type: 'earning',   calculationType: 'flat',       amountOrPercentage: 3200,isTaxable: false, isStatutory: false, isPartOfGross: true,  dependsOnAttendance: false, createdBy: adminDoc._id.toString() },
    { name: 'Medical Allowance',     type: 'earning',   calculationType: 'flat',       amountOrPercentage: 1500,isTaxable: false, isStatutory: false, isPartOfGross: true,  dependsOnAttendance: false, createdBy: adminDoc._id.toString() },
    { name: 'Special Allowance',     type: 'earning',   calculationType: 'flat',       amountOrPercentage: 0,   isTaxable: true,  isStatutory: false, isPartOfGross: true,  dependsOnAttendance: true,  createdBy: adminDoc._id.toString() },
    { name: 'Performance Bonus',     type: 'earning',   calculationType: 'flat',       amountOrPercentage: 0,   isTaxable: true,  isStatutory: false, isPartOfGross: false, dependsOnAttendance: false, createdBy: adminDoc._id.toString() },
    { name: 'Provident Fund',        type: 'deduction', calculationType: 'percentage', amountOrPercentage: 12,  isTaxable: false, isStatutory: true,  isPartOfGross: false, dependsOnAttendance: false, createdBy: adminDoc._id.toString() },
    { name: 'Professional Tax',      type: 'deduction', calculationType: 'flat',       amountOrPercentage: 200, isTaxable: false, isStatutory: true,  isPartOfGross: false, dependsOnAttendance: false, createdBy: adminDoc._id.toString() },
    { name: 'TDS',                   type: 'deduction', calculationType: 'flat',       amountOrPercentage: 0,   isTaxable: false, isStatutory: true,  isPartOfGross: false, dependsOnAttendance: false, createdBy: adminDoc._id.toString() },
  ]);
  const comp = {};
  compList.forEach(c => { comp[c.name] = c; });

  // 7. Salary Templates
  console.log('Seeding Salary Templates...');
  const templateDocs = await SalaryTemplate.insertMany([
    {
      name: 'Junior Band', description: 'Entry-level band for freshers and junior roles.', isDefaultTemplate: true, createdBy: adminDoc._id.toString(),
      components: [
        { component: comp['Basic Pay']._id, overrideAmount: 18000 },
        { component: comp['House Rent Allowance']._id },
        { component: comp['Transport Allowance']._id },
        { component: comp['Medical Allowance']._id },
        { component: comp['Special Allowance']._id, overrideAmount: 5100 },
        { component: comp['Provident Fund']._id },
        { component: comp['Professional Tax']._id },
      ],
    },
    {
      name: 'Mid Band', description: 'Mid-level band for experienced professionals.', isDefaultTemplate: false, createdBy: adminDoc._id.toString(),
      components: [
        { component: comp['Basic Pay']._id, overrideAmount: 33000 },
        { component: comp['House Rent Allowance']._id },
        { component: comp['Transport Allowance']._id },
        { component: comp['Medical Allowance']._id },
        { component: comp['Special Allowance']._id, overrideAmount: 10500 },
        { component: comp['Provident Fund']._id },
        { component: comp['Professional Tax']._id },
        { component: comp['TDS']._id, overrideAmount: 2500 },
      ],
    },
    {
      name: 'Senior Band', description: 'Senior band for leads, architects, and specialist roles.', isDefaultTemplate: false, createdBy: adminDoc._id.toString(),
      components: [
        { component: comp['Basic Pay']._id, overrideAmount: 54000 },
        { component: comp['House Rent Allowance']._id },
        { component: comp['Transport Allowance']._id },
        { component: comp['Medical Allowance']._id },
        { component: comp['Special Allowance']._id, overrideAmount: 18500 },
        { component: comp['Performance Bonus']._id, overrideAmount: 5000 },
        { component: comp['Provident Fund']._id },
        { component: comp['Professional Tax']._id },
        { component: comp['TDS']._id, overrideAmount: 5000 },
      ],
    },
    {
      name: 'Manager Band', description: 'Managerial band for department heads and team leads.', isDefaultTemplate: false, createdBy: adminDoc._id.toString(),
      components: [
        { component: comp['Basic Pay']._id, overrideAmount: 78000 },
        { component: comp['House Rent Allowance']._id },
        { component: comp['Transport Allowance']._id },
        { component: comp['Medical Allowance']._id },
        { component: comp['Special Allowance']._id, overrideAmount: 30000 },
        { component: comp['Performance Bonus']._id, overrideAmount: 10000 },
        { component: comp['Provident Fund']._id },
        { component: comp['Professional Tax']._id },
        { component: comp['TDS']._id, overrideAmount: 12000 },
      ],
    },
  ]);
  const tmpl = {};
  templateDocs.forEach(t => { tmpl[t.name] = t; });

  // 8. Employees
  console.log('Seeding Employees...');
  const empPw = hashPw('Emp@12345');
  const deptMgrId = {
    'Engineering': mgr['Engineering']._id,
    'Sales & Marketing': mgr['Sales & Marketing']._id,
    'Finance': mgr['Finance']._id,
    'Operations': mgr['Operations']._id,
  };

  const empRaw = [
    { _id:'26010112301', firstName:'Ravi',     lastName:'Kumar',    gender:'Male',   dateOfBirth:d(1995,3,12), maritalStatus:'Single',  phone:'9876543210', email:'ravi.kumar@nexacore.in',      currentAddress:'14 Green Park, Bengaluru 560001',       permanentAddress:'14 Green Park, Bengaluru 560001',       emergencyContactName:'Sita Kumar',    emergencyContactNumber:'9876543211', employeeId:'EMP-ENG-001', department:'Engineering',      designation:'Software Engineer',        joiningDate:d(2024,2,5),   employmentType:'full-time', workLocation:'Bengaluru HQ',    shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'1234567890123', bankName:'HDFC Bank',      bankIFSC:'HDFC0001234', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26010212302', firstName:'Anjali',   lastName:'Singh',    gender:'Female', dateOfBirth:d(1997,7,20), maritalStatus:'Single',  phone:'9123456780', email:'anjali.singh@nexacore.in',    currentAddress:'22 Koramangala, Bengaluru 560034',      permanentAddress:'22 Koramangala, Bengaluru 560034',      emergencyContactName:'Raj Singh',     emergencyContactNumber:'9123456781', fatherGuardianName:'Raj Singh', guardianContact:'9123456781', employeeId:'EMP-ENG-002', department:'Engineering',      designation:'UI/UX Designer',           joiningDate:d(2024,4,10),  employmentType:'full-time', workLocation:'Bengaluru HQ',    shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'2345678901234', bankName:'SBI',            bankIFSC:'SBIN0002345', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26020512303', firstName:'Nikhil',   lastName:'Joshi',    gender:'Male',   dateOfBirth:d(1993,11,5), maritalStatus:'Married', phone:'9234567891', email:'nikhil.joshi@nexacore.in',    currentAddress:'7 Indiranagar, Bengaluru 560038',       permanentAddress:'7 Indiranagar, Bengaluru 560038',       emergencyContactName:'Meera Joshi',   emergencyContactNumber:'9234567892', spouseName:'Meera Joshi', spouseContactNumber:'9234567892', employeeId:'EMP-ENG-003', department:'Engineering',      designation:'Senior Software Engineer', joiningDate:d(2023,8,1),   employmentType:'full-time', workLocation:'Bengaluru HQ',    shiftType:'day',      workingHoursStart:'09:30', workingHoursEnd:'18:30', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:55000, bankAccountNumber:'3456789012345', bankName:'ICICI Bank',     bankIFSC:'ICIC0003456', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Mid Band']._id    },
    { _id:'26030112304', firstName:'Pooja',    lastName:'Desai',    gender:'Female', dateOfBirth:d(1994,5,18), maritalStatus:'Single',  phone:'9345678902', email:'pooja.desai@nexacore.in',     currentAddress:'B-12 Whitefield, Bengaluru 560066',    permanentAddress:'B-12 Whitefield, Bengaluru 560066',    emergencyContactName:'Ramesh Desai',  emergencyContactNumber:'9345678903', fatherGuardianName:'Ramesh Desai', guardianContact:'9345678903', employeeId:'EMP-ENG-004', department:'Engineering',      designation:'QA Engineer',              joiningDate:d(2024,1,15),  employmentType:'full-time', workLocation:'Bengaluru HQ',    shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'4567890123456', bankName:'Axis Bank',      bankIFSC:'UTIB0004567', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26040112305', firstName:'Siddharth',lastName:'Rao',      gender:'Male',   dateOfBirth:d(1991,9,25), maritalStatus:'Married', phone:'9456789013', email:'siddharth.rao@nexacore.in',   currentAddress:'H-4 Electronic City, Bengaluru 560100',permanentAddress:'H-4 Electronic City, Bengaluru 560100',emergencyContactName:'Preethi Rao',   emergencyContactNumber:'9456789014', spouseName:'Preethi Rao', spouseContactNumber:'9456789014', employeeId:'EMP-ENG-005', department:'Engineering',      designation:'DevOps Engineer',          joiningDate:d(2023,5,20),  employmentType:'full-time', workLocation:'Bengaluru HQ',    shiftType:'flexible', workingHoursStart:'10:00', workingHoursEnd:'19:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:55000, bankAccountNumber:'5678901234567', bankName:'Kotak Mahindra', bankIFSC:'KKBK0005678', pfApplicable:true,  esicApplicable:false, overtimeEligible:true, salaryTemplate:tmpl['Mid Band']._id    },
    { _id:'25120112306', firstName:'Meghna',   lastName:'Patel',    gender:'Female', dateOfBirth:d(1990,1,30), maritalStatus:'Married', phone:'9567890124', email:'meghna.patel@nexacore.in',    currentAddress:'3 HSR Layout, Bengaluru 560102',        permanentAddress:'3 HSR Layout, Bengaluru 560102',        emergencyContactName:'Vikram Patel',  emergencyContactNumber:'9567890125', spouseName:'Vikram Patel', spouseContactNumber:'9567890125', employeeId:'EMP-ENG-006', department:'Engineering',      designation:'Senior Software Engineer', joiningDate:d(2022,9,12),  employmentType:'full-time', workLocation:'Bengaluru HQ',    shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:90000, bankAccountNumber:'6789012345678', bankName:'HDFC Bank',      bankIFSC:'HDFC0006789', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Senior Band']._id },
    { _id:'26050112307', firstName:'Rohit',    lastName:'Agarwal',  gender:'Male',   dateOfBirth:d(1996,6,15), maritalStatus:'Single',  phone:'9678901235', email:'rohit.agarwal@nexacore.in',   currentAddress:'25 MG Road, Mumbai 400001',             permanentAddress:'25 MG Road, Mumbai 400001',             emergencyContactName:'Sudhir Agarwal',emergencyContactNumber:'9678901236', employeeId:'EMP-SAL-001', department:'Sales & Marketing', designation:'Sales Executive',          joiningDate:d(2024,3,18),  employmentType:'full-time', workLocation:'Mumbai Office',   shiftType:'day',      workingHoursStart:'09:30', workingHoursEnd:'18:30', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'7890123456789', bankName:'SBI',            bankIFSC:'SBIN0007890', pfApplicable:true,  esicApplicable:true,  salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26060112308', firstName:'Divya',    lastName:'Krishnan', gender:'Female', dateOfBirth:d(1995,8,22), maritalStatus:'Single',  phone:'9789012346', email:'divya.krishnan@nexacore.in',  currentAddress:'11 Andheri West, Mumbai 400058',        permanentAddress:'11 Andheri West, Mumbai 400058',        emergencyContactName:'Krishnan T',    emergencyContactNumber:'9789012347', fatherGuardianName:'Krishnan T', guardianContact:'9789012347', employeeId:'EMP-SAL-002', department:'Sales & Marketing', designation:'Sales Executive',          joiningDate:d(2024,6,1),   employmentType:'full-time', workLocation:'Mumbai Office',   shiftType:'day',      workingHoursStart:'09:30', workingHoursEnd:'18:30', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'8901234567890', bankName:'ICICI Bank',     bankIFSC:'ICIC0008901', pfApplicable:true,  esicApplicable:true,  salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26070112309', firstName:'Karan',    lastName:'Mehta',    gender:'Male',   dateOfBirth:d(1992,4,7),  maritalStatus:'Married', phone:'9890123457', email:'karan.mehta@nexacore.in',     currentAddress:'8 Bandra East, Mumbai 400051',          permanentAddress:'8 Bandra East, Mumbai 400051',          emergencyContactName:'Nisha Mehta',   emergencyContactNumber:'9890123458', spouseName:'Nisha Mehta', spouseContactNumber:'9890123458', employeeId:'EMP-SAL-003', department:'Sales & Marketing', designation:'Sales Executive',          joiningDate:d(2023,11,10), employmentType:'full-time', workLocation:'Mumbai Office',   shiftType:'day',      workingHoursStart:'09:30', workingHoursEnd:'18:30', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:55000, bankAccountNumber:'9012345678901', bankName:'Axis Bank',      bankIFSC:'UTIB0009012', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Mid Band']._id    },
    { _id:'26080112310', firstName:'Shruti',   lastName:'Bansal',   gender:'Female', dateOfBirth:d(1993,12,3), maritalStatus:'Single',  phone:'9901234568', email:'shruti.bansal@nexacore.in',   currentAddress:'45 Powai, Mumbai 400076',               permanentAddress:'45 Powai, Mumbai 400076',               emergencyContactName:'Hemant Bansal', emergencyContactNumber:'9901234569', fatherGuardianName:'Hemant Bansal', guardianContact:'9901234569', employeeId:'EMP-SAL-004', department:'Sales & Marketing', designation:'Sales Executive',          joiningDate:d(2024,5,22),  employmentType:'full-time', workLocation:'Mumbai Office',   shiftType:'day',      workingHoursStart:'09:30', workingHoursEnd:'18:30', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'0123456789012', bankName:'Kotak Mahindra', bankIFSC:'KKBK0000123', pfApplicable:true,  esicApplicable:true,  salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26090112311', firstName:'Amita',    lastName:'Shah',     gender:'Female', dateOfBirth:d(1988,2,14), maritalStatus:'Married', phone:'9012345679', email:'amita.shah@nexacore.in',      currentAddress:'6 Nariman Point, Mumbai 400021',        permanentAddress:'6 Nariman Point, Mumbai 400021',        emergencyContactName:'Viral Shah',    emergencyContactNumber:'9012345670', spouseName:'Viral Shah', spouseContactNumber:'9012345670', employeeId:'EMP-FIN-001', department:'Finance',           designation:'Financial Analyst',        joiningDate:d(2022,7,11),  employmentType:'full-time', workLocation:'Mumbai Office',   shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:55000, bankAccountNumber:'1357924680135', bankName:'HDFC Bank',      bankIFSC:'HDFC0001357', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Mid Band']._id    },
    { _id:'26100112312', firstName:'Tanmay',   lastName:'Kulkarni', gender:'Male',   dateOfBirth:d(1991,10,28),maritalStatus:'Single',  phone:'9113456790', email:'tanmay.kulkarni@nexacore.in', currentAddress:'33 Lower Parel, Mumbai 400013',         permanentAddress:'33 Lower Parel, Mumbai 400013',         emergencyContactName:'Vasant Kulkarni',emergencyContactNumber:'9113456791',employeeId:'EMP-FIN-002', department:'Finance',           designation:'Financial Analyst',        joiningDate:d(2023,9,5),   employmentType:'full-time', workLocation:'Mumbai Office',   shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'2468013579246', bankName:'SBI',            bankIFSC:'SBIN0002468', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26110112313', firstName:'Nandita',  lastName:'Iyer',     gender:'Female', dateOfBirth:d(1986,3,6),  maritalStatus:'Married', phone:'9224567801', email:'nandita.iyer@nexacore.in',    currentAddress:'19 Churchgate, Mumbai 400020',          permanentAddress:'19 Churchgate, Mumbai 400020',          emergencyContactName:'Anand Iyer',    emergencyContactNumber:'9224567802', spouseName:'Anand Iyer', spouseContactNumber:'9224567802', employeeId:'EMP-FIN-003', department:'Finance',           designation:'Financial Analyst',        joiningDate:d(2021,4,19),  employmentType:'full-time', workLocation:'Mumbai Office',   shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:90000, bankAccountNumber:'3579124680357', bankName:'ICICI Bank',     bankIFSC:'ICIC0003579', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Senior Band']._id },
    { _id:'26120112314', firstName:'Aditya',   lastName:'Bose',     gender:'Male',   dateOfBirth:d(1994,7,9),  maritalStatus:'Single',  phone:'9335678912', email:'aditya.bose@nexacore.in',     currentAddress:'12 Park Street, Kolkata 700016',        permanentAddress:'12 Park Street, Kolkata 700016',        emergencyContactName:'Swapan Bose',   emergencyContactNumber:'9335678913', employeeId:'EMP-OPS-001', department:'Operations',        designation:'Operations Analyst',       joiningDate:d(2024,1,8),   employmentType:'full-time', workLocation:'Kolkata Branch',  shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'4680235791468', bankName:'Axis Bank',      bankIFSC:'UTIB0004680', pfApplicable:true,  esicApplicable:true,  salaryTemplate:tmpl['Junior Band']._id },
    { _id:'26010312315', firstName:'Ritika',   lastName:'Ghosh',    gender:'Female', dateOfBirth:d(1996,2,24), maritalStatus:'Single',  phone:'9446789023', email:'ritika.ghosh@nexacore.in',    currentAddress:'5 Ballygunge, Kolkata 700019',          permanentAddress:'5 Ballygunge, Kolkata 700019',          emergencyContactName:'Tarun Ghosh',   emergencyContactNumber:'9446789024', fatherGuardianName:'Tarun Ghosh', guardianContact:'9446789024', employeeId:'EMP-OPS-002', department:'Operations',        designation:'Operations Analyst',       joiningDate:d(2024,7,1),   employmentType:'full-time', workLocation:'Kolkata Branch',  shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:30000, bankAccountNumber:'5791346802579', bankName:'Kotak Mahindra', bankIFSC:'KKBK0005791', pfApplicable:true,  esicApplicable:true,  salaryTemplate:tmpl['Junior Band']._id },
    { _id:'25090112316', firstName:'Sourav',   lastName:'Das',      gender:'Male',   dateOfBirth:d(1989,5,3),  maritalStatus:'Married', phone:'9557890134', email:'sourav.das@nexacore.in',      currentAddress:'30 Salt Lake, Kolkata 700091',          permanentAddress:'30 Salt Lake, Kolkata 700091',          emergencyContactName:'Tulika Das',    emergencyContactNumber:'9557890135', spouseName:'Tulika Das', spouseContactNumber:'9557890135', employeeId:'EMP-OPS-003', department:'Operations',        designation:'Operations Analyst',       joiningDate:d(2022,3,28),  employmentType:'full-time', workLocation:'Kolkata Branch',  shiftType:'day',      workingHoursStart:'09:00', workingHoursEnd:'18:00', weeklyWorkingDays:5, wageType:'monthly', salaryAmount:55000, bankAccountNumber:'6802457913680', bankName:'HDFC Bank',      bankIFSC:'HDFC0006802', pfApplicable:true,  esicApplicable:false, salaryTemplate:tmpl['Mid Band']._id    },
  ];

  await User.collection.insertMany(empRaw.map(e => ({
    ...e,
    password: empPw,
    age: calcAge(e.dateOfBirth),
    active_inactive: true,
    role: 'employee',
    reportingManager: deptMgrId[e.department] || null,
  })));

  const userDocs = await User.find({});
  const empByDept = {};
  userDocs.forEach(u => {
    if (!empByDept[u.department]) empByDept[u.department] = [];
    empByDept[u.department].push(u);
  });
  const eng = empByDept['Engineering'] || [];
  const sal = empByDept['Sales & Marketing'] || [];
  const fin = empByDept['Finance'] || [];
  const ops = empByDept['Operations'] || [];
  console.log('  Employees seeded:', userDocs.length);

  // 9. Leave Policies
  console.log('Seeding Leave Policies...');
  await LeavePolicy.insertMany([
    { leaveName: 'Casual Leave',      description: 'For personal matters requiring a short absence.',      allowedRoles: ['employee','manager','hr'], annualLimit: 12,  minNoticeHours: 24  },
    { leaveName: 'Sick Leave',        description: 'For health-related absences.',                         allowedRoles: ['employee','manager','hr'], annualLimit: 10,  minNoticeHours: 0   },
    { leaveName: 'Earned Leave',      description: 'Accrued leave earned through tenure.',                 allowedRoles: ['employee','manager','hr'], annualLimit: 15,  minNoticeHours: 72  },
    { leaveName: 'Maternity Leave',   description: 'Paid maternity leave as per statutory rules.',         allowedRoles: ['employee','hr'],           annualLimit: 180, minNoticeHours: 720 },
    { leaveName: 'Compensatory Off',  description: 'Leave earned after working on holidays or weekends.', allowedRoles: ['employee','manager','hr'], annualLimit: 6,   minNoticeHours: 24  },
  ]);

  // 10. Leave Balances
  console.log('Seeding Leave Balances...');
  const leaveTypes = ['Casual Leave','Sick Leave','Earned Leave','Compensatory Off'];
  const leaveDefaults = { 'Casual Leave':12,'Sick Leave':10,'Earned Leave':15,'Compensatory Off':6 };
  const leaveUsed = {
    'Casual Leave':    [3,1,4,2,0,5,2,3,1,4,2,1,0,3,2,1],
    'Sick Leave':      [2,0,1,3,0,2,1,0,2,1,0,1,2,0,1,3],
    'Earned Leave':    [5,3,7,2,1,8,4,3,6,2,3,5,1,4,6,2],
    'Compensatory Off':[1,0,2,0,1,0,1,2,0,1,0,0,1,2,0,1],
  };
  const balDocs = [];
  userDocs.forEach((u, idx) => {
    leaveTypes.forEach(lt => {
      const opening = leaveDefaults[lt];
      const used = (leaveUsed[lt]||[])[idx]||0;
      balDocs.push({ userId:u._id, year:2026, leaveType:lt, openingBalance:opening, used, carryForward:0, encashed:0, lapsed:0, closingBalance:opening-used });
    });
  });
  await LeaveBalance.insertMany(balDocs);

  // 11. Leave Requests
  console.log('Seeding Leave Requests...');
  await LeaveRequest.insertMany([
    { userId:eng[0]?._id, leaveType:'Casual Leave',     startDate:d(2026,7,14), endDate:d(2026,7,15), reason:'Attending elder sibling wedding ceremony.',           leaveUnit:'full-day',              status:'Approved',          managerId:mgr['Engineering']._id.toString(),      managerComments:'Approved. Enjoy the ceremony!' },
    { userId:eng[2]?._id, leaveType:'Sick Leave',       startDate:d(2026,8,4),  endDate:d(2026,8,5),  reason:'High fever and viral infection.',                     leaveUnit:'full-day',              status:'Approved',          managerId:mgr['Engineering']._id.toString(),      managerComments:'Take rest and get well soon.' },
    { userId:sal[2]?._id, leaveType:'Earned Leave',     startDate:d(2026,7,21), endDate:d(2026,7,25), reason:'Family vacation trip to Goa.',                        leaveUnit:'full-day',              status:'Approved',          managerId:mgr['Sales & Marketing']._id.toString(),managerComments:'Approved. Have a great trip!' },
    { userId:fin[0]?._id, leaveType:'Casual Leave',     startDate:d(2026,8,11), endDate:d(2026,8,11), reason:'Child school admission follow-up.',                   leaveUnit:'full-day',              status:'Approved',          managerId:mgr['Finance']._id.toString() },
    { userId:ops[2]?._id, leaveType:'Earned Leave',     startDate:d(2026,6,16), endDate:d(2026,6,20), reason:'Annual home-town visit for family gathering.',        leaveUnit:'full-day',              status:'Approved',          managerId:mgr['Operations']._id.toString() },
    { userId:eng[1]?._id, leaveType:'Casual Leave',     startDate:d(2026,8,28), endDate:d(2026,8,28), reason:'Personal errand - vehicle registration.',             leaveUnit:'half-day', halfDayPeriod:'second-half', status:'Pending',  managerId:mgr['Engineering']._id.toString() },
    { userId:sal[0]?._id, leaveType:'Sick Leave',       startDate:d(2026,8,25), endDate:d(2026,8,26), reason:'Back pain, doctor advised rest for two days.',        leaveUnit:'full-day',              status:'Pending',           managerId:mgr['Sales & Marketing']._id.toString() },
    { userId:ops[0]?._id, leaveType:'Compensatory Off', startDate:d(2026,8,29), endDate:d(2026,8,29), reason:'Comp-off for working on 9 Aug (Independence Day).', leaveUnit:'full-day',              status:'Pending',           managerId:mgr['Operations']._id.toString() },
    { userId:fin[1]?._id, leaveType:'Earned Leave',     startDate:d(2026,9,1),  endDate:d(2026,9,5),  reason:'Personal travel.',                                   leaveUnit:'full-day',              status:'Rejected',          managerId:mgr['Finance']._id.toString(),           rejectionReason:'Month-end closing is during this period. Please reschedule.' },
    { userId:eng[4]?._id, leaveType:'Earned Leave',     startDate:d(2026,9,8),  endDate:d(2026,9,12), reason:'Annual planned vacation.',                           leaveUnit:'full-day',              status:'Changes Requested', managerId:mgr['Engineering']._id.toString(),      managerComments:'Sprint deadline on 10th - can you push start date to 11th?' },
  ]);

  // 12. Workflow Templates
  console.log('Seeding Workflow Templates...');
  await WorkflowTemplate.insertMany([
    {
      name: 'Standard Employee Onboarding', type: 'onboarding', isActive: true,
      tasks: [
        { title: 'Send Welcome Email & Login Credentials',       assignedToRole: 'Hr',               estimatedHours: 1   },
        { title: 'Issue Laptop and Accessories',                  assignedToRole: 'Admin',             estimatedHours: 2   },
        { title: 'Set Up Email & System Accounts',               assignedToRole: 'Admin',             estimatedHours: 2   },
        { title: 'Complete Payroll & Bank Details Entry',        assignedToRole: 'Hr',               estimatedHours: 1   },
        { title: 'Schedule 30-Day Check-in Meeting',             assignedToRole: 'Reporting_Manager', estimatedHours: 1   },
        { title: 'Assign Buddy / Mentor',                        assignedToRole: 'Manager',           estimatedHours: 0.5 },
        { title: 'Enroll in Benefits & Leave Portal',            assignedToRole: 'Hr',               estimatedHours: 1   },
        { title: 'Conduct Policy Orientation Session',           assignedToRole: 'Hr',               estimatedHours: 2   },
      ],
    },
    {
      name: 'Engineering Onboarding - Technical Setup', type: 'onboarding', isActive: true,
      tasks: [
        { title: 'Provision GitHub / Jira / Confluence Access',  assignedToRole: 'Admin',             department: 'Engineering', estimatedHours: 1   },
        { title: 'Set Up Dev Environment & Repo Access',         assignedToRole: 'Manager',           department: 'Engineering', estimatedHours: 3   },
        { title: 'Code Review Process Walkthrough',              assignedToRole: 'Manager',           department: 'Engineering', estimatedHours: 1.5 },
        { title: 'Security & VPN Setup',                         assignedToRole: 'Admin',             department: 'Engineering', estimatedHours: 1   },
        { title: 'Introduction to Current Sprint',               assignedToRole: 'Reporting_Manager', department: 'Engineering', estimatedHours: 1   },
      ],
    },
    {
      name: 'Standard Employee Offboarding', type: 'offboarding', isActive: true,
      tasks: [
        { title: 'Collect Company Assets (Laptop, ID Card)',     assignedToRole: 'Admin',             estimatedHours: 1 },
        { title: 'Revoke All System & Application Access',       assignedToRole: 'Admin',             estimatedHours: 2 },
        { title: 'Process Full & Final Settlement',              assignedToRole: 'Hr',               estimatedHours: 3 },
        { title: 'Conduct Exit Interview',                       assignedToRole: 'Hr',               estimatedHours: 1 },
        { title: 'Send Experience Letter & Relieving Letter',    assignedToRole: 'Hr',               estimatedHours: 1 },
        { title: 'Knowledge Transfer Completion Sign-off',       assignedToRole: 'Reporting_Manager', estimatedHours: 4 },
      ],
    },
  ]);

  // 13. Projects
  console.log('Seeding Projects...');
  const projectDocs = await Project.insertMany([
    {
      title: 'NexaCore ERP v3.0 - Core Module Redesign',
      description: 'Full redesign and re-architecture of the ERP core module for improved scalability, performance, and a modern UI. Targeting a microservices migration for the reporting engine.',
      status: 'active', priority: 'critical', startDate: d(2026,6,1), endDate: d(2026,11,30), billable: true, budget: 2800000,
      createdBy: adminDoc._id.toString(), createdByModel: 'Admin',
      projectManager: mgr['Engineering']._id.toString(), projectManagerModel: 'Manager', projectManagerEmail: mgr['Engineering'].email,
      department: 'Engineering', tags: ['erp','redesign','microservices','react'],
      members: [
        { userId: mgr['Engineering']._id.toString(), userModel: 'Manager', email: mgr['Engineering'].email, role: 'lead' },
        { userId: eng[0]?._id, userModel: 'User', email: eng[0]?.email, role: 'member' },
        { userId: eng[2]?._id, userModel: 'User', email: eng[2]?.email, role: 'member' },
        { userId: eng[4]?._id, userModel: 'User', email: eng[4]?.email, role: 'member' },
        { userId: eng[5]?._id, userModel: 'User', email: eng[5]?.email, role: 'member' },
        { userId: hrDocs[0]._id.toString(), userModel: 'Hr', email: hrDocs[0].email, role: 'viewer' },
      ],
      milestones: [
        { title: 'Design Phase Complete',          dueDate: d(2026,7,15),  isCompleted: true,  completedAt: d(2026,7,12) },
        { title: 'Backend APIs - Phase 1 Live',    dueDate: d(2026,9,15),  isCompleted: false },
        { title: 'Frontend Integration Complete',  dueDate: d(2026,10,31), isCompleted: false },
        { title: 'UAT Sign-off & Go Live',         dueDate: d(2026,11,28), isCompleted: false },
      ],
    },
    {
      title: 'Q3 2026 - Digital Marketing Campaign',
      description: 'End-to-end planning and execution of the Q3 digital marketing campaign across LinkedIn, Google Ads, and email channels. Target: 35% increase in qualified inbound leads.',
      status: 'active', priority: 'high', startDate: d(2026,7,1), endDate: d(2026,9,30), billable: false, budget: 750000,
      createdBy: mgr['Sales & Marketing']._id.toString(), createdByModel: 'Manager',
      projectManager: mgr['Sales & Marketing']._id.toString(), projectManagerModel: 'Manager', projectManagerEmail: mgr['Sales & Marketing'].email,
      department: 'Sales & Marketing', tags: ['marketing','digital','lead-gen','q3-2026'],
      members: [
        { userId: mgr['Sales & Marketing']._id.toString(), userModel: 'Manager', email: mgr['Sales & Marketing'].email, role: 'lead' },
        { userId: sal[0]?._id, userModel: 'User', email: sal[0]?.email, role: 'member' },
        { userId: sal[1]?._id, userModel: 'User', email: sal[1]?.email, role: 'member' },
        { userId: sal[2]?._id, userModel: 'User', email: sal[2]?.email, role: 'member' },
        { userId: sal[3]?._id, userModel: 'User', email: sal[3]?.email, role: 'member' },
      ],
      milestones: [
        { title: 'Campaign Strategy Approved',        dueDate: d(2026,7,10), isCompleted: true,  completedAt: d(2026,7,8)  },
        { title: 'Ad Creatives & Copy Finalized',     dueDate: d(2026,7,25), isCompleted: true,  completedAt: d(2026,7,23) },
        { title: 'Mid-Campaign Performance Review',   dueDate: d(2026,8,20), isCompleted: false },
        { title: 'Campaign Wrap-up Report',           dueDate: d(2026,9,30), isCompleted: false },
      ],
    },
    {
      title: 'Annual Financial Audit 2025-26',
      description: 'Preparation, collation, and review of all financial statements and records for FY 2025-26 annual statutory audit. Coordination with external auditors.',
      status: 'active', priority: 'critical', startDate: d(2026,8,1), endDate: d(2026,9,30), billable: false, budget: 180000,
      createdBy: mgr['Finance']._id.toString(), createdByModel: 'Manager',
      projectManager: mgr['Finance']._id.toString(), projectManagerModel: 'Manager', projectManagerEmail: mgr['Finance'].email,
      department: 'Finance', tags: ['audit','compliance','finance','fy26'],
      members: [
        { userId: mgr['Finance']._id.toString(), userModel: 'Manager', email: mgr['Finance'].email, role: 'lead' },
        { userId: fin[0]?._id, userModel: 'User', email: fin[0]?.email, role: 'member' },
        { userId: fin[1]?._id, userModel: 'User', email: fin[1]?.email, role: 'member' },
        { userId: fin[2]?._id, userModel: 'User', email: fin[2]?.email, role: 'member' },
        { userId: hrDocs[0]._id.toString(), userModel: 'Hr', email: hrDocs[0].email, role: 'viewer' },
        { userId: adminDoc._id.toString(), userModel: 'Admin', email: adminDoc.email, role: 'viewer' },
      ],
      milestones: [
        { title: 'Document Collection & Pre-Audit Review', dueDate: d(2026,8,15), isCompleted: true, completedAt: d(2026,8,14) },
        { title: 'External Auditor Sessions Complete',      dueDate: d(2026,9,15), isCompleted: false },
        { title: 'Audit Report Signed & Filed',             dueDate: d(2026,9,30), isCompleted: false },
      ],
    },
    {
      title: 'Operations Process Automation - Phase 1',
      description: 'Identify and automate 5 repetitive operational processes using RPA and scripting. Phase 1 covers inventory tracking, vendor invoice matching, and daily report generation.',
      status: 'planning', priority: 'medium', startDate: d(2026,9,1), endDate: d(2027,2,28), billable: true, budget: 600000,
      createdBy: adminDoc._id.toString(), createdByModel: 'Admin',
      projectManager: mgr['Operations']._id.toString(), projectManagerModel: 'Manager', projectManagerEmail: mgr['Operations'].email,
      department: 'Operations', tags: ['automation','rpa','operations','phase-1'],
      members: [
        { userId: mgr['Operations']._id.toString(), userModel: 'Manager', email: mgr['Operations'].email, role: 'lead' },
        { userId: ops[0]?._id, userModel: 'User', email: ops[0]?.email, role: 'member' },
        { userId: ops[1]?._id, userModel: 'User', email: ops[1]?.email, role: 'member' },
        { userId: ops[2]?._id, userModel: 'User', email: ops[2]?.email, role: 'member' },
        { userId: eng[4]?._id, userModel: 'User', email: eng[4]?.email, role: 'member' },
      ],
      milestones: [
        { title: 'Process Discovery & Mapping Complete',  dueDate: d(2026,9,20),  isCompleted: false },
        { title: 'RPA Bot - Inventory Tracking Live',     dueDate: d(2026,11,15), isCompleted: false },
        { title: 'All 5 Automations Deployed',            dueDate: d(2027,2,15),  isCompleted: false },
      ],
    },
    {
      title: 'SmartCMS - Mobile App v1.0',
      description: 'Native mobile application for SmartCMS enabling employees to check payslips, apply for leaves, view tasks, and track attendance from smartphones. iOS and Android.',
      status: 'on_hold', priority: 'medium', startDate: d(2026,4,15), endDate: d(2026,12,31), billable: false, budget: 1200000,
      createdBy: adminDoc._id.toString(), createdByModel: 'Admin',
      projectManager: mgr['Engineering']._id.toString(), projectManagerModel: 'Manager', projectManagerEmail: mgr['Engineering'].email,
      department: 'Engineering', tags: ['mobile','ios','android','smartcms'],
      members: [
        { userId: mgr['Engineering']._id.toString(), userModel: 'Manager', email: mgr['Engineering'].email, role: 'lead' },
        { userId: eng[1]?._id, userModel: 'User', email: eng[1]?.email, role: 'member' },
        { userId: eng[3]?._id, userModel: 'User', email: eng[3]?.email, role: 'member' },
      ],
      milestones: [
        { title: 'UI/UX Wireframes Approved',       dueDate: d(2026,5,30),  isCompleted: true, completedAt: d(2026,5,28) },
        { title: 'MVP - Leave & Payslip Screens',   dueDate: d(2026,8,30),  isCompleted: false },
        { title: 'Full App Beta Release',            dueDate: d(2026,12,15), isCompleted: false },
      ],
    },
  ]);
  const [projERP, projMktg, projAudit, projOps, projMobile] = projectDocs;

  // 14. Tasks
  console.log('Seeding Tasks...');
  await Task.insertMany([
    { projectId:projERP._id,    taskType:'project', title:'Design new database schema for reporting module',      description:'Document and design the updated DB schema for the revamped reporting microservice covering all legacy report types.',                              status:'done',        priority:'high',     milestoneId:projERP.milestones[0]._id,    assignedTo:eng[2]?._id,                        assignedToName:'Nikhil Joshi',    assignedToModel:'User',    assignedBy:mgr['Engineering']._id.toString(),       assignedByName:'Arjun Sharma',  dueDate:d(2026,7,10), completedAt:d(2026,7,9),  estimatedHours:16, loggedHours:14, activityLog:[{action:'Created',performedBy:mgr['Engineering']._id.toString(),performedByName:'Arjun Sharma',at:d(2026,6,5)},{action:'Completed',performedBy:eng[2]?._id,performedByName:'Nikhil Joshi',at:d(2026,7,9)}] },
    { projectId:projERP._id,    taskType:'project', title:'Build REST APIs for dashboard data endpoints',         description:'Implement 8 new REST API endpoints for the dashboard widgets with pagination, filtering, and role-based access control.',                        status:'in_progress', priority:'critical', milestoneId:projERP.milestones[1]._id,    assignedTo:eng[0]?._id,                        assignedToName:'Ravi Kumar',      assignedToModel:'User',    assignedBy:mgr['Engineering']._id.toString(),       assignedByName:'Arjun Sharma',  dueDate:d(2026,9,5),  estimatedHours:40, loggedHours:18, comments:[{authorId:mgr['Engineering']._id.toString(),authorName:'Arjun Sharma',authorRole:'manager',text:'Ensure Swagger docs are updated alongside.',createdAt:d(2026,8,10)}], activityLog:[{action:'Created',performedBy:mgr['Engineering']._id.toString(),performedByName:'Arjun Sharma',at:d(2026,7,20)},{action:'Status changed to in_progress',performedBy:eng[0]?._id,performedByName:'Ravi Kumar',at:d(2026,8,1)}] },
    { projectId:projERP._id,    taskType:'project', title:'Set up CI/CD pipeline for ERP backend services',       description:'Configure GitHub Actions workflows for automated testing, Docker image building, and deployment to staging environment.',                          status:'done',        priority:'high',                                               assignedTo:eng[4]?._id,                        assignedToName:'Siddharth Rao',   assignedToModel:'User',    assignedBy:mgr['Engineering']._id.toString(),       assignedByName:'Arjun Sharma',  dueDate:d(2026,7,20), completedAt:d(2026,7,18), estimatedHours:12, loggedHours:10, activityLog:[{action:'Created',performedBy:mgr['Engineering']._id.toString(),performedByName:'Arjun Sharma',at:d(2026,6,18)},{action:'Completed',performedBy:eng[4]?._id,performedByName:'Siddharth Rao',at:d(2026,7,18)}] },
    { projectId:projERP._id,    taskType:'project', title:'Refactor frontend component library to React 19',      description:'Upgrade all legacy class components to functional components with hooks. Enforce design token usage from the new design system.',                 status:'in_progress', priority:'high',     milestoneId:projERP.milestones[2]._id,    assignedTo:eng[5]?._id,                        assignedToName:'Meghna Patel',    assignedToModel:'User',    assignedBy:mgr['Engineering']._id.toString(),       assignedByName:'Arjun Sharma',  dueDate:d(2026,10,15),estimatedHours:60, loggedHours:22, activityLog:[{action:'Created',performedBy:mgr['Engineering']._id.toString(),performedByName:'Arjun Sharma',at:d(2026,8,1)}] },
    { projectId:projERP._id,    taskType:'project', title:'Write integration test suite for reporting APIs',      description:'Cover all 8 new dashboard endpoints with integration tests. Aim for >90% coverage on the reporting module.',                                      status:'todo',        priority:'medium',   milestoneId:projERP.milestones[2]._id,    assignedTo:eng[3]?._id,                        assignedToName:'Pooja Desai',     assignedToModel:'User',    assignedBy:mgr['Engineering']._id.toString(),       assignedByName:'Arjun Sharma',  dueDate:d(2026,10,20),estimatedHours:24, loggedHours:0,  activityLog:[{action:'Created',performedBy:mgr['Engineering']._id.toString(),performedByName:'Arjun Sharma',at:d(2026,8,10)}] },
    { projectId:projERP._id,    taskType:'project', title:'Conduct UAT sessions with Finance and Ops teams',     description:'Schedule and run 3 rounds of UAT with end-users from Finance and Operations. Document feedback and raise tickets for fixes.',                    status:'todo',        priority:'critical', milestoneId:projERP.milestones[3]._id,    assignedTo:mgr['Engineering']._id.toString(),  assignedToName:'Arjun Sharma',    assignedToModel:'Manager', assignedBy:adminDoc._id.toString(),                 assignedByName:'Rajesh Khanna', dueDate:d(2026,11,20),estimatedHours:20, loggedHours:0,  activityLog:[{action:'Created',performedBy:adminDoc._id.toString(),performedByName:'Rajesh Khanna',at:d(2026,8,5)}] },
    { projectId:projMktg._id,   taskType:'project', title:'Create LinkedIn ad copy - 5 variants',                description:'Write and A/B test 5 LinkedIn sponsored content copies targeting enterprise decision-makers in BFSI and manufacturing.',                        status:'done',        priority:'high',     milestoneId:projMktg.milestones[1]._id,   assignedTo:sal[1]?._id,                        assignedToName:'Divya Krishnan',  assignedToModel:'User',    assignedBy:mgr['Sales & Marketing']._id.toString(), assignedByName:'Kavya Nair',    dueDate:d(2026,7,22), completedAt:d(2026,7,21), estimatedHours:8,  loggedHours:7,  activityLog:[{action:'Created',performedBy:mgr['Sales & Marketing']._id.toString(),performedByName:'Kavya Nair',at:d(2026,7,12)},{action:'Completed',performedBy:sal[1]?._id,performedByName:'Divya Krishnan',at:d(2026,7,21)}] },
    { projectId:projMktg._id,   taskType:'project', title:'Set up Google Ads campaigns - 3 ad groups',           description:'Configure and launch 3 ad groups targeting SME and enterprise keywords. Set bid strategy to Target CPA Rs.1200.',                             status:'in_progress', priority:'high',     milestoneId:projMktg.milestones[2]._id,   assignedTo:sal[0]?._id,                        assignedToName:'Rohit Agarwal',   assignedToModel:'User',    assignedBy:mgr['Sales & Marketing']._id.toString(), assignedByName:'Kavya Nair',    dueDate:d(2026,8,18), estimatedHours:12, loggedHours:6,  activityLog:[{action:'Created',performedBy:mgr['Sales & Marketing']._id.toString(),performedByName:'Kavya Nair',at:d(2026,7,28)}] },
    { projectId:projMktg._id,   taskType:'project', title:'Monthly lead pipeline report - August 2026',          description:'Compile MQL and SQL data from Salesforce, Google Ads, and LinkedIn into the monthly pipeline report dashboard.',                               status:'todo',        priority:'medium',   milestoneId:projMktg.milestones[2]._id,   assignedTo:sal[2]?._id,                        assignedToName:'Karan Mehta',     assignedToModel:'User',    assignedBy:mgr['Sales & Marketing']._id.toString(), assignedByName:'Kavya Nair',    dueDate:d(2026,8,26), estimatedHours:6,  loggedHours:0,  activityLog:[{action:'Created',performedBy:mgr['Sales & Marketing']._id.toString(),performedByName:'Kavya Nair',at:d(2026,8,15)}] },
    { projectId:projMktg._id,   taskType:'project', title:'Draft Q3 campaign wrap-up presentation',              description:'Prepare a comprehensive campaign performance deck with ROI analysis, channel-wise breakdown, and Q4 recommendations.',                        status:'todo',        priority:'medium',   milestoneId:projMktg.milestones[3]._id,   assignedTo:sal[3]?._id,                        assignedToName:'Shruti Bansal',   assignedToModel:'User',    assignedBy:mgr['Sales & Marketing']._id.toString(), assignedByName:'Kavya Nair',    dueDate:d(2026,9,28), estimatedHours:10, loggedHours:0,  activityLog:[{action:'Created',performedBy:mgr['Sales & Marketing']._id.toString(),performedByName:'Kavya Nair',at:d(2026,8,15)}] },
    { projectId:projAudit._id,  taskType:'project', title:'Collate Bank Reconciliation Statements - All Accounts',description:'Pull BRS for all 7 company bank accounts for FY 2025-26. Reconcile differences and flag discrepancies.',                                   status:'done',        priority:'critical',                                               assignedTo:fin[0]?._id,                        assignedToName:'Amita Shah',      assignedToModel:'User',    assignedBy:mgr['Finance']._id.toString(),           assignedByName:'Suresh Pillai', dueDate:d(2026,8,12), completedAt:d(2026,8,11), estimatedHours:20, loggedHours:22, activityLog:[{action:'Created',performedBy:mgr['Finance']._id.toString(),performedByName:'Suresh Pillai',at:d(2026,8,1)},{action:'Completed',performedBy:fin[0]?._id,performedByName:'Amita Shah',at:d(2026,8,11)}] },
    { projectId:projAudit._id,  taskType:'project', title:'Prepare Fixed Assets Register for FY 2025-26',        description:'Update the fixed assets register with all additions, disposals, and depreciation for the fiscal year.',                                         status:'in_progress', priority:'high',                                               assignedTo:fin[2]?._id,                        assignedToName:'Nandita Iyer',    assignedToModel:'User',    assignedBy:mgr['Finance']._id.toString(),           assignedByName:'Suresh Pillai', dueDate:d(2026,9,10), estimatedHours:16, loggedHours:8,  activityLog:[{action:'Created',performedBy:mgr['Finance']._id.toString(),performedByName:'Suresh Pillai',at:d(2026,8,2)}] },
    { projectId:projAudit._id,  taskType:'project', title:'GST Reconciliation & ITR Filing Review',               description:'Reconcile GSTR-2B with purchase register and review ITR computations with tax consultant before final filing.',                              status:'todo',        priority:'critical',                                               assignedTo:fin[1]?._id,                        assignedToName:'Tanmay Kulkarni', assignedToModel:'User',    assignedBy:mgr['Finance']._id.toString(),           assignedByName:'Suresh Pillai', dueDate:d(2026,9,8),  estimatedHours:24, loggedHours:0,  activityLog:[{action:'Created',performedBy:mgr['Finance']._id.toString(),performedByName:'Suresh Pillai',at:d(2026,8,5)}] },
    { projectId:projOps._id,    taskType:'project', title:'Document current inventory tracking process (As-Is)',  description:'Interview warehouse staff and create detailed process flow diagrams for the existing manual inventory tracking workflow.',                       status:'todo',        priority:'medium',                                               assignedTo:ops[0]?._id,                        assignedToName:'Aditya Bose',     assignedToModel:'User',    assignedBy:mgr['Operations']._id.toString(),        assignedByName:'Deepak Verma',  dueDate:d(2026,9,12), estimatedHours:12, loggedHours:0,  activityLog:[{action:'Created',performedBy:mgr['Operations']._id.toString(),performedByName:'Deepak Verma',at:d(2026,8,20)}] },
    { projectId:projOps._id,    taskType:'project', title:'Vendor invoice matching - RPA requirements spec',      description:'Write detailed business requirements and technical specifications for the vendor invoice matching RPA bot.',                                     status:'todo',        priority:'medium',                                               assignedTo:ops[2]?._id,                        assignedToName:'Sourav Das',      assignedToModel:'User',    assignedBy:mgr['Operations']._id.toString(),        assignedByName:'Deepak Verma',  dueDate:d(2026,9,18), estimatedHours:10, loggedHours:0,  activityLog:[{action:'Created',performedBy:mgr['Operations']._id.toString(),performedByName:'Deepak Verma',at:d(2026,8,20)}] },
    { projectId:projMobile._id, taskType:'project', title:'Redesign Leave Application Screen - Mobile',           description:'Redesign the leave application form for mobile with a step-by-step wizard UI. Must support half-day and comp-off selection.',               status:'blocked',     priority:'high',     milestoneId:projMobile.milestones[1]._id, assignedTo:eng[1]?._id,                        assignedToName:'Anjali Singh',    assignedToModel:'User',    assignedBy:mgr['Engineering']._id.toString(),       assignedByName:'Arjun Sharma',  dueDate:d(2026,8,30), estimatedHours:20, loggedHours:5,  comments:[{authorId:eng[1]?._id,authorName:'Anjali Singh',authorRole:'employee',text:'Blocked pending clarification on design system tokens for mobile. Raised with design lead.',createdAt:d(2026,8,12)}], activityLog:[{action:'Created',performedBy:mgr['Engineering']._id.toString(),performedByName:'Arjun Sharma',at:d(2026,7,1)},{action:'Status changed to blocked',performedBy:eng[1]?._id,performedByName:'Anjali Singh',at:d(2026,8,12)}] },
    { projectId:projMobile._id, taskType:'project', title:'Set up React Native project and navigation structure', description:'Bootstrap the RN project, configure expo, set up React Navigation v7 with tab and stack navigators per wireframe.',                          status:'done',        priority:'high',     milestoneId:projMobile.milestones[0]._id, assignedTo:eng[3]?._id,                        assignedToName:'Pooja Desai',     assignedToModel:'User',    assignedBy:mgr['Engineering']._id.toString(),       assignedByName:'Arjun Sharma',  dueDate:d(2026,5,20), completedAt:d(2026,5,18), estimatedHours:8,  loggedHours:9,  activityLog:[{action:'Created',performedBy:mgr['Engineering']._id.toString(),performedByName:'Arjun Sharma',at:d(2026,4,18)},{action:'Completed',performedBy:eng[3]?._id,performedByName:'Pooja Desai',at:d(2026,5,18)}] },
  ]);

  // 15. Assets
  console.log('Seeding Assets...');
  await Asset.insertMany([
    { name:'Dell Latitude 5540 - Ravi Kumar',       serialNumber:'DL5540-RK-001',    category:'Laptop',     status:'Assigned',    assignedTo:eng[0]?._id,                          assignmentDate:d(2024,2,6),  purchaseDate:d(2023,11,10), purchaseCost:87500, notes:'Assigned on joining day.' },
    { name:'Dell Latitude 5540 - Anjali Singh',     serialNumber:'DL5540-AS-002',    category:'Laptop',     status:'Assigned',    assignedTo:eng[1]?._id,                          assignmentDate:d(2024,4,11), purchaseDate:d(2024,3,20),  purchaseCost:88000 },
    { name:'MacBook Pro 14 - Nikhil Joshi',         serialNumber:'MBP14-NJ-003',     category:'Laptop',     status:'Assigned',    assignedTo:eng[2]?._id,                          assignmentDate:d(2023,8,2),  purchaseDate:d(2023,7,15),  purchaseCost:185000 },
    { name:'MacBook Pro 14 - Meghna Patel',         serialNumber:'MBP14-MP-004',     category:'Laptop',     status:'Assigned',    assignedTo:eng[5]?._id,                          assignmentDate:d(2022,9,13), purchaseDate:d(2022,8,28),  purchaseCost:172000 },
    { name:'Dell XPS 15 - Siddharth Rao',           serialNumber:'DXPS15-SR-005',    category:'Laptop',     status:'Assigned',    assignedTo:eng[4]?._id,                          assignmentDate:d(2023,5,21), purchaseDate:d(2023,4,30),  purchaseCost:142000 },
    { name:'HP ProBook 450 - Amita Shah',           serialNumber:'HPP450-AMI-006',   category:'Laptop',     status:'Assigned',    assignedTo:fin[0]?._id,                          assignmentDate:d(2022,7,12), purchaseDate:d(2022,6,20),  purchaseCost:72000 },
    { name:'HP ProBook 450 - Aditya Bose',          serialNumber:'HPP450-ADB-007',   category:'Laptop',     status:'Assigned',    assignedTo:ops[0]?._id,                          assignmentDate:d(2024,1,9),  purchaseDate:d(2023,12,15), purchaseCost:73500 },
    { name:'Lenovo ThinkPad L14 - Rohit Agarwal',   serialNumber:'LTPL14-RA-008',    category:'Laptop',     status:'Assigned',    assignedTo:sal[0]?._id,                          assignmentDate:d(2024,3,19), purchaseDate:d(2024,3,1),   purchaseCost:68000 },
    { name:'iPhone 14 - Manager Kavya Nair',        serialNumber:'IP14-KN-009',      category:'Mobile Phone',status:'Assigned',   assignedTo:mgr['Sales & Marketing']._id.toString(),assignmentDate:d(2023,7,1),  purchaseDate:d(2023,6,20),  purchaseCost:79000, notes:'Manager official mobile.' },
    { name:'Ergonomic Chair - Nikhil Joshi',        serialNumber:'ERGO-CH-NJ-010',   category:'Furniture',  status:'Assigned',    assignedTo:eng[2]?._id,                          assignmentDate:d(2024,1,15), purchaseDate:d(2024,1,10),  purchaseCost:18500 },
    { name:'Dell Latitude 5540 - Spare Unit',       serialNumber:'DL5540-SPARE-011', category:'Laptop',     status:'Available',   purchaseDate:d(2024,5,1),  purchaseCost:87500, notes:'Ready for next joining.' },
    { name:'27in LG UltraWide Monitor',             serialNumber:'LG27UW-001',       category:'Monitor',    status:'Available',   purchaseDate:d(2024,2,15), purchaseCost:32000 },
    { name:'Logitech MX Keys Keyboard',             serialNumber:'LGMXK-001',        category:'Peripherals',status:'Available',   purchaseDate:d(2024,3,10), purchaseCost:8500 },
    { name:'Jabra Evolve2 55 Headset',              serialNumber:'JBE255-001',       category:'Peripherals',status:'Available',   purchaseDate:d(2024,1,20), purchaseCost:22000 },
    { name:'Dell Latitude 5540 - In Repair',        serialNumber:'DL5540-REP-012',   category:'Laptop',     status:'Maintenance', purchaseDate:d(2023,6,5),  purchaseCost:84000, notes:'Keyboard replacement in progress. Expected return: 30-Aug-2026.' },
    { name:'HP LaserJet Printer - HQ',             serialNumber:'HPLJ-HQ-001',      category:'Printer',    status:'Maintenance', purchaseDate:d(2022,4,10), purchaseCost:35000, notes:'Paper feed roller replacement. Sent to service centre.' },
    { name:'Dell Inspiron 15 (2018 Model)',         serialNumber:'DI15-OLD-013',     category:'Laptop',     status:'Retired',     purchaseDate:d(2018,8,1),  purchaseCost:55000, notes:'Decommissioned - hardware end of life.' },
  ]);

  // 16. Expenses
  console.log('Seeding Expenses...');
  await Expense.insertMany([
    { employee:eng[2]?._id, amount:3200,  currency:'INR', category:'Travel',                expenseDate:d(2026,8,5),  description:'Flight tickets - Bengaluru to Pune for client meeting on 6th Aug.',                    status:'Approved',   approvedBy:mgr['Engineering']._id.toString() },
    { employee:eng[4]?._id, amount:4800,  currency:'INR', category:'Travel',                expenseDate:d(2026,7,22), description:'Train + Taxi for DevOps summit, Hyderabad - 22-23 Jul 2026.',                         status:'Reimbursed', approvedBy:mgr['Engineering']._id.toString() },
    { employee:sal[2]?._id, amount:12500, currency:'INR', category:'Client Entertainment',  expenseDate:d(2026,8,8),  description:'Client dinner at ITC Grand Central for 4 people - enterprise deal closure.',           status:'Approved',   approvedBy:mgr['Sales & Marketing']._id.toString() },
    { employee:sal[0]?._id, amount:2100,  currency:'INR', category:'Travel',                expenseDate:d(2026,8,14), description:'Cab expense for client site visits in BKC area on 14th Aug.',                         status:'Pending' },
    { employee:fin[0]?._id, amount:5600,  currency:'INR', category:'Training & Certification',expenseDate:d(2026,7,15), description:'CFA Level 1 exam registration fee - FY26 learning budget.',                       status:'Approved',   approvedBy:mgr['Finance']._id.toString() },
    { employee:fin[1]?._id, amount:1800,  currency:'INR', category:'Office Supplies',       expenseDate:d(2026,8,10), description:'Stationery and printer cartridges for Finance team - audit preparation.',              status:'Approved',   approvedBy:mgr['Finance']._id.toString() },
    { employee:ops[2]?._id, amount:6400,  currency:'INR', category:'Travel',                expenseDate:d(2026,8,3),  description:'Round trip flight Kolkata to Delhi for vendor negotiations on 3-4 Aug.',              status:'Approved',   approvedBy:mgr['Operations']._id.toString() },
    { employee:eng[5]?._id, amount:3900,  currency:'INR', category:'Software & Tools',      expenseDate:d(2026,8,1),  description:'Annual JetBrains All Products Pack license renewal.',                                 status:'Rejected',   rejectionReason:'Company already provides team license. Personal purchase not eligible.' },
    { employee:ops[0]?._id, amount:2400,  currency:'INR', category:'Office Supplies',       expenseDate:d(2026,8,16), description:'Whiteboard markers and A3 paper for Kolkata branch process mapping sessions.',          status:'Pending' },
    { employee:sal[3]?._id, amount:890,   currency:'INR', category:'Travel',                expenseDate:d(2026,8,18), description:'Local travel by auto/cab for marketing event setup at BKC venue.',                    status:'Pending' },
  ]);

  // 16.5. Attendance
  console.log('Seeding Attendance for June, July and August 2026...');
  const attendanceDocs = [];
  const addAttendance = (empId, mgrId, year, month, daysInMonth, lopCount) => {
    let absentMarked = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dDate = new Date(year, month - 1, day);
      const isWeekend = dDate.getDay() === 0 || dDate.getDay() === 6;
      if (isWeekend) continue;
      
      let status = 'present';
      if (absentMarked < lopCount) {
        status = 'absent';
        absentMarked++;
      }
      
      // Don't insert attendance for future dates except a few to simulate pending approvals
      const isFuture = dDate > new Date(2026, 7, 26); // assuming today is August 26, 2026

      if (!isFuture) {
         attendanceDocs.push({
          employeeId: String(empId),
          date: dDate,
          status: status,
          approvalStatus: 'approved',
          assignedManagerId: mgrId,
          workingHours: status === 'present' ? 8 : 0,
          checkIn: status === 'present' ? { time: new Date(year, month - 1, day, 9, 0, 0) } : undefined,
          checkOut: status === 'present' ? { time: new Date(year, month - 1, day, 17, 0, 0) } : undefined
        });
      } else if (day === 27 && month === 8) {
         // Create a pending attendance for tomorrow to test Manager Approvals
         attendanceDocs.push({
          employeeId: String(empId),
          date: dDate,
          status: 'present',
          approvalStatus: 'pending',
          assignedManagerId: mgrId,
          workingHours: 8,
          checkIn: { 
            time: new Date(year, month - 1, day, 9, 0, 0),
            address: 'Bengaluru HQ, Koramangala',
            distance: 12
          },
          checkOut: { time: new Date(year, month - 1, day, 17, 0, 0) }
        });
      }
    }
  };

  const getMgr = (emp) => deptMgrId[emp.department];

  const empSalaryInfo = [
    { emp:eng[0], basic:18000, special:5100,  tpl:'Junior Band', lopDays:0 },
    { emp:eng[1], basic:18000, special:5100,  tpl:'Junior Band', lopDays:1 },
    { emp:eng[2], basic:33000, special:10500, tpl:'Mid Band',    lopDays:0 },
    { emp:eng[3], basic:18000, special:5100,  tpl:'Junior Band', lopDays:0 },
    { emp:eng[4], basic:33000, special:10500, tpl:'Mid Band',    lopDays:0 },
    { emp:eng[5], basic:54000, special:18500, tpl:'Senior Band', lopDays:0 },
    { emp:sal[0], basic:18000, special:5100,  tpl:'Junior Band', lopDays:2 },
    { emp:sal[1], basic:18000, special:5100,  tpl:'Junior Band', lopDays:0 },
    { emp:sal[2], basic:33000, special:10500, tpl:'Mid Band',    lopDays:0 },
    { emp:sal[3], basic:18000, special:5100,  tpl:'Junior Band', lopDays:1 },
    { emp:fin[0], basic:33000, special:10500, tpl:'Mid Band',    lopDays:0 },
    { emp:fin[1], basic:18000, special:5100,  tpl:'Junior Band', lopDays:0 },
    { emp:fin[2], basic:54000, special:18500, tpl:'Senior Band', lopDays:0 },
    { emp:ops[0], basic:18000, special:5100,  tpl:'Junior Band', lopDays:0 },
    { emp:ops[1], basic:18000, special:5100,  tpl:'Junior Band', lopDays:0 },
    { emp:ops[2], basic:33000, special:10500, tpl:'Mid Band',    lopDays:1 },
  ];

  const payMonthsTarget = [
    { year:2026, month:6, days:30 },
    { year:2026, month:7, days:31 },
    { year:2026, month:8, days:31 }
  ];

  for (const pm of payMonthsTarget) {
    for (const { emp, lopDays } of empSalaryInfo) {
      if (!emp) continue;
      // Distribute lopDays only in June and July as per requirement, or August
      const appliedLop = (pm.month === 6 || pm.month === 7) ? lopDays : 0;
      addAttendance(emp._id, getMgr(emp), pm.year, pm.month, pm.days, appliedLop);
    }
  }

  await Attendance.insertMany(attendanceDocs);
  console.log('  Attendance seeded:', attendanceDocs.length);

  // 17. Payslips (June, July, August 2026)
  console.log('Seeding Payslips...');
  const payMonths = [
    { year:2026, month:6,  startDate:d(2026,6,1),  endDate:d(2026,6,30),  daysInMonth:30, status:'locked'   },
    { year:2026, month:7,  startDate:d(2026,7,1),  endDate:d(2026,7,31),  daysInMonth:31, status:'locked'   }
  ];
  const payslipDocs = [];
  for (const pm of payMonths) {
    for (const { emp, basic, special, tpl, lopDays } of empSalaryInfo) {
      if (!emp) continue;
      const payableDays = pm.daysInMonth - lopDays;
      const basicPaid   = Math.round(basic   * payableDays / pm.daysInMonth);
      const hra         = Math.round(basicPaid * 0.4);
      const transport   = 3200;
      const medical     = 1500;
      const specialPaid = Math.round(special * payableDays / pm.daysInMonth);
      const grossEarnings  = basicPaid + hra + transport + medical + specialPaid;
      const pf             = Math.round(basicPaid * 0.12);
      const pt             = 200;
      const totalDeductions = pf + pt;
      payslipDocs.push({
        employeeId: emp._id,
        payPeriod: { year: pm.year, month: pm.month, startDate: pm.startDate, endDate: pm.endDate },
        daysInMonth: pm.daysInMonth, paidDays: payableDays, lopDays,
        salaryTemplate: tmpl[tpl]._id,
        components: [
          { component: comp['Basic Pay']._id,            name: 'Basic Pay',            type: 'earning',   calculationType: 'flat',       resolvedAmount: basicPaid,   isProRated: lopDays > 0, isPartOfGross: true  },
          { component: comp['House Rent Allowance']._id, name: 'House Rent Allowance', type: 'earning',   calculationType: 'percentage', resolvedAmount: hra,          isProRated: false,       isPartOfGross: true  },
          { component: comp['Transport Allowance']._id,  name: 'Transport Allowance',  type: 'earning',   calculationType: 'flat',       resolvedAmount: transport,    isProRated: false,       isPartOfGross: true  },
          { component: comp['Medical Allowance']._id,    name: 'Medical Allowance',    type: 'earning',   calculationType: 'flat',       resolvedAmount: medical,      isProRated: false,       isPartOfGross: true  },
          { component: comp['Special Allowance']._id,    name: 'Special Allowance',    type: 'earning',   calculationType: 'flat',       resolvedAmount: specialPaid,  isProRated: lopDays > 0, isPartOfGross: true  },
          { component: comp['Provident Fund']._id,       name: 'Provident Fund',       type: 'deduction', calculationType: 'percentage', resolvedAmount: pf,           isProRated: false,       isPartOfGross: false },
          { component: comp['Professional Tax']._id,     name: 'Professional Tax',     type: 'deduction', calculationType: 'flat',       resolvedAmount: pt,           isProRated: false,       isPartOfGross: false },
        ],
        grossEarnings, totalDeductions, netPay: grossEarnings - totalDeductions,
        status: pm.status,
        approvedBy: hrDocs[0]._id.toString(),
        approvedAt: new Date(pm.year, pm.month - 1, 28),
        lockedAt: pm.status === 'locked' ? new Date(pm.year, pm.month - 1, 29) : undefined,
        generatedBy: hrDocs[0]._id.toString(),
      });
    }
  }
  await Payslip.insertMany(payslipDocs);
  console.log('  Payslips seeded:', payslipDocs.length);

  // 18. Salary Revisions
  console.log('Seeding Salary Revisions...');
  await SalaryRevision.insertMany([
    { userId: eng[5]?._id, effectiveDate: d(2026,4,1),  previousTemplate: tmpl['Mid Band']._id,    newTemplate: tmpl['Senior Band']._id, previousOverrides: [], newOverrides: [], reason: 'Annual performance appraisal - promoted to Senior Band following exceptional FY25-26 performance rating of 4.7/5.',                                                                                   approvedBy: adminDoc._id.toString()    },
    { userId: fin[2]?._id, effectiveDate: d(2026,1,1),  previousTemplate: tmpl['Mid Band']._id,    newTemplate: tmpl['Senior Band']._id, previousOverrides: [], newOverrides: [], reason: 'Designation change to Senior Financial Analyst. Salary revised to Senior Band as per revised pay matrix.',                                                                                              approvedBy: hrDocs[0]._id.toString()   },
    { userId: eng[2]?._id, effectiveDate: d(2026,6,1),  previousTemplate: tmpl['Junior Band']._id, newTemplate: tmpl['Mid Band']._id,    previousOverrides: [{ component: comp['Special Allowance']._id, overrideAmount: 5100  }], newOverrides: [{ component: comp['Special Allowance']._id, overrideAmount: 10500 }], reason: 'Mid-year correction: Nikhil moved from Junior to Mid Band effective June 2026 after completing 3 years of service.', approvedBy: hrDocs[0]._id.toString()   },
  ]);

  console.log('');
  console.log('========================================');
  console.log('SEEDING COMPLETE!');
  console.log('  1  Admin');
  console.log('  2  HR Users');
  console.log('  4  Managers');
  console.log('  5  Departments');
  console.log('  15 Designations');
  console.log('  16 Employees');
  console.log('  9  Salary Components');
  console.log('  4  Salary Templates');
  console.log('  5  Leave Policies');
  console.log('  64 Leave Balances');
  console.log('  10 Leave Requests');
  console.log('  3  Workflow Templates');
  console.log('  5  Projects (with milestones & members)');
  console.log('  17 Tasks');
  console.log('  17 Assets');
  console.log('  10 Expenses');
  console.log('  ' + payslipDocs.length + ' Payslips (Jun-Aug 2026)');
  console.log('  3  Salary Revisions');
  console.log('========================================');

  await mongoose.disconnect();
  console.log('Disconnected. Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
