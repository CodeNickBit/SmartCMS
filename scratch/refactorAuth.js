const fs = require('fs');
const path = require('path');
const originalPath = path.join('backend', 'routes', 'auth.js');
const controllerPath = path.join('backend', 'controllers', 'authController.js');

let content = fs.readFileSync(originalPath, 'utf8');

let controllerImports = `const User = require('../models/User');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const otpStore = new Map();

function createTransporter() {
  const emailUser = (process.env.EMAIL_USER || 'ankbizzcorp@gmail.com').trim();
  const emailPassword = process.env.EMAIL_PASSWORD
    ? process.env.EMAIL_PASSWORD.trim().replace(/\\s+/g, '')
    : '';
  if (!emailPassword) throw new Error('Email configuration error: EMAIL_PASSWORD is required');
  return nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPassword } });
}
`;

let controllerContent = controllerImports + '\n';

let routeImports = `const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
`;

let routeContent = routeImports + '\n';

let lines = content.split('\n');

let i = 22; // start after createTransporter() { ... } 
while(i < lines.length) {
  let line = lines[i];
  if (line.startsWith('router.')) {
     break;
  }
  i++;
}

while(i < lines.length) {
  let line = lines[i];
  
  if (line.startsWith('router.')) {
     let match = line.match(/router\.(get|post|put|delete|patch)\('([^']+)'(.*), async \(req, res\) => {/);
     if (match) {
        let method = match[1];
        let endpoint = match[2];
        let middlewares = match[3]; 
        
        let parts = endpoint.split('/').filter(Boolean);
        let name = '';
        if (endpoint === '/register') name = 'register';
        else if (endpoint === '/register-admin') name = 'registerAdmin';
        else if (endpoint === '/login') name = 'login';
        else if (endpoint === '/send-otp') name = 'sendOtp';
        else if (endpoint === '/verify-otp') name = 'verifyOtp';
        else if (endpoint === '/reset-password') name = 'resetPassword';
        else if (endpoint.startsWith('/users/:id/status')) name = 'updateUserStatus';
        else if (endpoint.startsWith('/users/:id') && method === 'put') name = 'updateUser';
        else if (endpoint.startsWith('/users/:id') && method === 'delete') name = 'deleteUser';
        else if (endpoint.startsWith('/users/:id') && method === 'get') name = 'getUserById';
        else if (endpoint === '/my-team') name = 'getMyTeam';
        else if (endpoint === '/users') name = 'getUsers';
        else name = 'handle' + parts.map(p => p.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() + p.replace(/[^a-zA-Z]/g, '').slice(1)).join('');

        controllerContent += `exports.${name} = async (req, res) => {\n`;
        routeContent += `router.${method}('${endpoint}'${middlewares}, authController.${name});\n`;
        i++;
        continue;
     }
  }
  
  if (line === 'module.exports = router;') {
    routeContent += '\nmodule.exports = router;\n';
    break;
  }
  
  if (line === '});' || line === '});\r') {
    controllerContent += '};\n\n';
    i++;
    continue;
  }
  
  controllerContent += line + '\n';
  i++;
}

// Fix trailing carriage returns that might break JS execution
controllerContent = controllerContent.replace(/^}\);\r?$/gm, '};');

fs.writeFileSync(controllerPath, controllerContent);
fs.writeFileSync(originalPath, routeContent);
console.log('Auth refactoring complete');
