const SalaryComponent = require('../models/SalaryComponent');
const SalaryTemplate = require('../models/SalaryTemplate');
const SalaryRevision = require('../models/SalaryRevision');
const Payslip = require('../models/Payslip');
const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const { computePayrollSync } = require('../services/payrollSyncService');
const { calculateEmployeePayroll } = require('../services/payrollCalculationEngine');

// === Salary Components === //

exports.createComponent = async (req, res) => {
    try {
        const component = new SalaryComponent({
            ...req.body,
            createdBy: req.user?._id
        });
        await component.save();
        res.status(201).json({ message: 'Salary component created successfully', component });
    } catch (error) {
        console.error('Error creating salary component:', error);
        res.status(500).json({ message: 'Failed to create component', error: error.message });
    }
};

exports.getComponents = async (req, res) => {
    try {
        const components = await SalaryComponent.find().populate('percentageOf', 'name');
        res.status(200).json(components);
    } catch (error) {
        console.error('Error fetching components:', error);
        res.status(500).json({ message: 'Failed to fetch components', error: error.message });
    }
};

exports.updateComponent = async (req, res) => {
    try {
        const component = await SalaryComponent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!component) return res.status(404).json({ message: 'Component not found' });
        res.status(200).json({ message: 'Salary component updated', component });
    } catch (error) {
        console.error('Error updating component:', error);
        res.status(500).json({ message: 'Failed to update component', error: error.message });
    }
};

exports.deleteComponent = async (req, res) => {
    try {
        // Technically should check if used in SalaryTemplate before deletion (or soft delete)
        const component = await SalaryComponent.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!component) return res.status(404).json({ message: 'Component not found' });
        res.status(200).json({ message: 'Salary component deactivated', component });
    } catch (error) {
        console.error('Error deleting component:', error);
        res.status(500).json({ message: 'Failed to deactivate component', error: error.message });
    }
};

// === Salary Templates === //

exports.createTemplate = async (req, res) => {
    try {
        const template = new SalaryTemplate({
            ...req.body,
            createdBy: req.user?._id
        });
        await template.save();
        res.status(201).json({ message: 'Salary template created successfully', template });
    } catch (error) {
        console.error('Error creating salary template:', error);
        res.status(500).json({ message: 'Failed to create template', error: error.message });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        const templates = await SalaryTemplate.find().populate('components.component');
        res.status(200).json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const template = await SalaryTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.status(200).json({ message: 'Salary template updated', template });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ message: 'Failed to update template', error: error.message });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const template = await SalaryTemplate.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.status(200).json({ message: 'Salary template deactivated', template });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Failed to deactivate template', error: error.message });
    }
};

// === Salary Revisions === //

exports.reviseUserSalary = async (req, res) => {
    try {
        const { userId, newTemplate, newOverrides, reason, effectiveDate } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const previousTemplate = user.salaryTemplate;
        const previousOverrides = user.salaryOverrides;

        // Create revision log
        const revision = new SalaryRevision({
            userId,
            effectiveDate: effectiveDate || new Date(),
            previousTemplate,
            newTemplate,
            previousOverrides,
            newOverrides,
            reason,
            approvedBy: req.user?._id
        });

        await revision.save();

        // Update user
        user.salaryTemplate = newTemplate;
        user.salaryOverrides = newOverrides || [];
        await user.save();

        res.status(200).json({ message: 'Salary revised successfully', revision, user });
    } catch (error) {
        console.error('Error revising salary:', error);
        res.status(500).json({ message: 'Failed to revise salary', error: error.message });
    }
};

// === Phase 2 & 3: Payroll Run Engine === //

exports.previewEmployeePayroll = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ message: 'year and month query params are required.' });
        }

        const settings = await CompanySettings.findOne().sort({ createdAt: -1 }).lean();
        const otRules = settings?.payrollSettings?.overtimeRules || null;

        const syncData = await computePayrollSync(employeeId, parseInt(year), parseInt(month));
        const payrollData = await calculateEmployeePayroll(employeeId, syncData, otRules);

        res.status(200).json({
            employeeId,
            year: parseInt(year),
            month: parseInt(month),
            syncData,
            ...payrollData
        });
    } catch (error) {
        console.error('Error previewing payroll:', error);
        res.status(500).json({ message: 'Failed to preview payroll', error: error.message });
    }
};

exports.runPayroll = async (req, res) => {
    try {
        const { year, month } = req.body;
        if (!year || !month) {
            return res.status(400).json({ message: 'year and month are required.' });
        }

        const settings = await CompanySettings.findOne().sort({ createdAt: -1 }).lean();
        const otRules = settings?.payrollSettings?.overtimeRules || null;

        // Get all employees with a salary template assigned
        const employees = await User.find({ salaryTemplate: { $exists: true, $ne: null }, active_inactive: true }).lean();

        if (employees.length === 0) {
            return res.status(400).json({ message: 'No employees with salary templates found.' });
        }

        const results = { success: [], skipped: [], errors: [] };

        for (const emp of employees) {
            try {
                // Check if payslip already exists for this period
                const existing = await Payslip.findOne({
                    employeeId: emp._id,
                    'payPeriod.year': year,
                    'payPeriod.month': month,
                    status: { $in: ['approved', 'locked'] }
                });

                if (existing) {
                    results.skipped.push({ employeeId: emp._id, reason: 'Payslip already approved/locked.' });
                    continue;
                }

                const syncData = await computePayrollSync(emp._id.toString(), parseInt(year), parseInt(month));

                if (!syncData.hasAttendanceRecords) {
                    // Cleanup any existing draft payslip if employee is skipped
                    await Payslip.findOneAndDelete({
                        employeeId: emp._id,
                        'payPeriod.year': year,
                        'payPeriod.month': month,
                        status: 'draft'
                    });
                    results.skipped.push({ employeeId: emp._id, reason: 'No attendance records found for this period.' });
                    continue;
                }

                const payrollData = await calculateEmployeePayroll(emp._id.toString(), syncData, otRules);

                // Upsert a draft payslip (replace any previous draft)
                await Payslip.findOneAndUpdate(
                    { employeeId: emp._id, 'payPeriod.year': year, 'payPeriod.month': month },
                    {
                        employeeId: emp._id,
                        payPeriod: {
                            year,
                            month,
                            startDate: syncData.startDate,
                            endDate: syncData.endDate
                        },
                        daysInMonth: syncData.totalWorkingDays,
                        paidDays: syncData.paidDays,
                        lopDays: syncData.lopDays,
                        salaryTemplate: payrollData.salaryTemplateId,
                        components: payrollData.components,
                        grossEarnings: payrollData.grossEarnings,
                        totalDeductions: payrollData.totalDeductions,
                        netPay: payrollData.netPay,
                        status: 'draft',
                        generatedBy: req.user?._id
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                results.success.push({ employeeId: emp._id, netPay: payrollData.netPay });
            } catch (empErr) {
                results.errors.push({ employeeId: emp._id, error: empErr.message });
            }
        }

        res.status(200).json({
            message: `Payroll run complete for ${year}-${month}.`,
            summary: {
                total: employees.length,
                success: results.success.length,
                skipped: results.skipped.length,
                errors: results.errors.length
            },
            results
        });
    } catch (error) {
        console.error('Error running payroll:', error);
        res.status(500).json({ message: 'Failed to run payroll', error: error.message });
    }
};

exports.approvePayslip = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.payslipId);
        if (!payslip) return res.status(404).json({ message: 'Payslip not found.' });

        if (payslip.status === 'locked') {
            return res.status(400).json({ message: 'Payslip is already locked.' });
        }

        payslip.status = 'locked';
        payslip.approvedBy = req.user?._id;
        payslip.approvedAt = new Date();
        payslip.lockedAt = new Date();
        await payslip.save();

        res.status(200).json({ message: 'Payslip approved and locked.', payslip });
    } catch (error) {
        console.error('Error approving payslip:', error);
        res.status(500).json({ message: 'Failed to approve payslip', error: error.message });
    }
};

exports.getPayslips = async (req, res) => {
    try {
        const { year, month, status } = req.query;
        const filter = {};
        if (year) filter['payPeriod.year'] = parseInt(year);
        if (month) filter['payPeriod.month'] = parseInt(month);
        if (status) filter.status = status;

        const payslips = await Payslip.find(filter)
            .populate('employeeId', 'firstName lastName email department designation')
            .populate('salaryTemplate', 'name')
            .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 });

        res.status(200).json(payslips);
    } catch (error) {
        console.error('Error fetching payslips:', error);
        res.status(500).json({ message: 'Failed to fetch payslips', error: error.message });
    }
};

exports.getEmployeePayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({ employeeId: req.params.employeeId })
            .populate('salaryTemplate', 'name')
            .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 });
        res.status(200).json(payslips);
    } catch (error) {
        console.error('Error fetching employee payslips:', error);
        res.status(500).json({ message: 'Failed to fetch payslips', error: error.message });
    }
};

exports.getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.payslipId)
            .populate('employeeId', 'firstName lastName email department designation employeeId')
            .populate('salaryTemplate', 'name')
            .populate('components.component', 'name type');

        if (!payslip) return res.status(404).json({ message: 'Payslip not found.' });
        res.status(200).json(payslip);
    } catch (error) {
        console.error('Error fetching payslip:', error);
        res.status(500).json({ message: 'Failed to fetch payslip', error: error.message });
    }
};

// === Company Payroll Settings === //

exports.getPayrollSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne().sort({ createdAt: -1 });
        if (!settings) {
            settings = new CompanySettings({});
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching payroll settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
    }
};

exports.updatePayrollSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne().sort({ createdAt: -1 });
        if (!settings) {
            settings = new CompanySettings({});
        }
        if (req.body.payrollSettings) {
            settings.payrollSettings = { ...settings.payrollSettings?.toObject?.() ?? {}, ...req.body.payrollSettings };
        }
        settings.updatedBy = req.user?._id;
        await settings.save();
        res.status(200).json({ message: 'Payroll settings updated.', settings });
    } catch (error) {
        console.error('Error updating payroll settings:', error);
        res.status(500).json({ message: 'Failed to update settings', error: error.message });
    }
};

// === Payroll Analytics === //
exports.getPayrollAnalytics = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // To get inclusive 6 months
        const startYear = sixMonthsAgo.getFullYear();
        const startMonth = sixMonthsAgo.getMonth() + 1; // 1-12

        const trendData = await Payslip.aggregate([
            {
                $match: {
                    $or: [
                        { 'payPeriod.year': { $gt: startYear } },
                        { 'payPeriod.year': startYear, 'payPeriod.month': { $gte: startMonth } }
                    ]
                }
            },
            {
                $group: {
                    _id: { year: '$payPeriod.year', month: '$payPeriod.month' },
                    totalGross: { $sum: '$grossEarnings' },
                    totalNet: { $sum: '$netPay' },
                    totalDeductions: { $sum: '$totalDeductions' },
                    headcount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const latestPeriod = await Payslip.findOne().sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 }).select('payPeriod');
        let currentMonthStats = null;
        
        if (latestPeriod) {
            const { year, month } = latestPeriod.payPeriod;
            
            const stats = await Payslip.aggregate([
                { $match: { 'payPeriod.year': year, 'payPeriod.month': month } },
                {
                    $group: {
                        _id: null,
                        totalNetPay: { $sum: '$netPay' },
                        totalGross: { $sum: '$grossEarnings' },
                        totalDeductions: { $sum: '$totalDeductions' },
                        averageNet: { $avg: '$netPay' },
                        averageGross: { $avg: '$grossEarnings' },
                        totalLopDays: { $sum: '$lopDays' },
                        headcount: { $sum: 1 }
                    }
                }
            ]);

            if(stats.length > 0) {
                const stat = stats[0];
                delete stat._id;
                currentMonthStats = { year, month, ...stat };
            }
        }

        res.status(200).json({ trendData, currentMonthStats });

    } catch (error) {
        console.error('Error fetching payroll analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
    }
};

