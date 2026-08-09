const fs = require('fs');
const path = require('path');
const originalPath = path.join('backend', 'routes', 'attendance.js');
const controllerPath = path.join('backend', 'controllers', 'attendanceController.js');

let content = fs.readFileSync(originalPath, 'utf8');

// The new imports for controller
let controllerImports = `const Attendance = require('../models/Attendance');
const OfficeLocation = require('../models/OfficeLocation');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Manager = require('../models/Manager');
const AttendanceEscalation = require('../models/AttendanceEscalation');
const { createNotification, notifyHRs } = require('../utils/notificationHelper');
`;

let controllerContent = controllerImports + '\n';

// Remove the top require blocks that are router specific
let routeImports = `const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isHR, isManager, isManagerOrHR } = require('../middleware/authMiddleware');
const attendanceController = require('../controllers/attendanceController');
`;

let routeContent = routeImports + '\n';

let lines = content.split('\n');

let i = 11; // start after initial imports
while(i < lines.length) {
  let line = lines[i];
  if (line.startsWith('router.')) {
     break;
  }
  controllerContent += line + '\n';
  i++;
}

// Now replace router.xxx endpoints
while(i < lines.length) {
  let line = lines[i];
  
  if (line.startsWith('async function canActOnAttendance')) {
    // Helper function in the middle
    let j = i;
    while (!lines[j].startsWith('}')) {
      controllerContent += lines[j] + '\n';
      j++;
    }
    controllerContent += lines[j] + '\n\n';
    i = j + 1;
    continue;
  }
  
  if (line.startsWith('router.')) {
     let match = line.match(/router\.(get|post|put|delete)\('([^']+)'(.*), async \(req, res\) => {/);
     if (match) {
        let method = match[1];
        let endpoint = match[2];
        let middlewares = match[3]; 
        
        let parts = endpoint.split('/').filter(Boolean);
        let name = '';
        if (endpoint === '/today') name = 'getToday';
        else if (endpoint === '/check-in') name = 'checkIn';
        else if (endpoint === '/check-out') name = 'checkOut';
        else if (endpoint === '/my-attendance') name = 'getMyAttendance';
        else if (endpoint === '/pending-approvals') name = 'getPendingApprovals';
        else if (endpoint.startsWith('/approve')) name = 'approveAttendance';
        else if (endpoint.startsWith('/decline')) name = 'declineAttendance';
        else if (endpoint.startsWith('/mark-late')) name = 'markLate';
        else if (endpoint.startsWith('/override')) name = 'overrideAttendance';
        else if (endpoint === '/correction-request') name = 'correctionRequest';
        else if (endpoint.startsWith('/correction-review')) name = 'correctionReview';
        else if (endpoint === '/report') name = 'getReport';
        else if (endpoint.startsWith('/audit-log')) name = 'getAuditLog';
        else if (endpoint === '/approval-history') name = 'getApprovalHistory';
        else if (endpoint === '/escalation-log') name = 'getEscalationLog';
        else if (endpoint === '/my-escalations') name = 'getMyEscalations';
        else if (endpoint === '/team-attendance') name = 'getTeamAttendance';
        else name = 'handle' + parts.map(p => p.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() + p.replace(/[^a-zA-Z]/g, '').slice(1)).join('');

        controllerContent += `exports.${name} = async (req, res) => {\n`;
        routeContent += `router.${method}('${endpoint}'${middlewares}, attendanceController.${name});\n`;
        i++;
        continue;
     }
  }
  
  if (line === 'module.exports = router;') {
    routeContent += '\nmodule.exports = router;\n';
    break;
  }
  
  if (line === '});') {
    controllerContent += '};\n\n';
    i++;
    continue;
  }
  
  controllerContent += line + '\n';
  i++;
}

fs.writeFileSync(controllerPath, controllerContent);
fs.writeFileSync(originalPath, routeContent);
console.log('Refactoring complete');
