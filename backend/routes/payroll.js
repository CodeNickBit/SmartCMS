const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Note: Ensure admin authorization where appropriate in the controller or via middleware
// For now, these routes require a valid token.

// Salary Components
router.post('/components', authenticateToken, payrollController.createComponent);
router.get('/components', authenticateToken, payrollController.getComponents);
router.put('/components/:id', authenticateToken, payrollController.updateComponent);
router.delete('/components/:id', authenticateToken, payrollController.deleteComponent);

// Salary Templates
router.post('/templates', authenticateToken, payrollController.createTemplate);
router.get('/templates', authenticateToken, payrollController.getTemplates);
router.put('/templates/:id', authenticateToken, payrollController.updateTemplate);
router.delete('/templates/:id', authenticateToken, payrollController.deleteTemplate);

// User Salary Assignment / Revisions
router.post('/revise-salary', authenticateToken, payrollController.reviseUserSalary);

// --- Phase 2 & 3: Payroll Run ---
// Preview a single employee's payroll for a given month
router.get('/preview/:employeeId', authenticateToken, payrollController.previewEmployeePayroll);

// Run (generate draft payslips) for all employees in a pay period
router.post('/run', authenticateToken, payrollController.runPayroll);

// Approve and lock a payslip
router.post('/payslips/:payslipId/approve', authenticateToken, payrollController.approvePayslip);

// Get all payslips for a pay period
router.get('/payslips', authenticateToken, payrollController.getPayslips);

// Get payslip history for a specific employee
router.get('/payslips/employee/:employeeId', authenticateToken, payrollController.getEmployeePayslips);

// Get a single payslip by ID
router.get('/payslips/:payslipId', authenticateToken, payrollController.getPayslipById);

// Company Payroll Settings
router.get('/company-settings', authenticateToken, payrollController.getPayrollSettings);
router.put('/company-settings', authenticateToken, payrollController.updatePayrollSettings);

// Payroll Analytics
router.get('/analytics', authenticateToken, payrollController.getPayrollAnalytics);

module.exports = router;
