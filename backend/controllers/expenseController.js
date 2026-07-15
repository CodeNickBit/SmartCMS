const Expense = require('../models/Expense');
const User = require('../models/User');

// Submit new expense
exports.submitExpense = async (req, res) => {
    try {
        const { amount, currency, category, expenseDate, description } = req.body;
        const employeeId = req.user._id;

        let receiptUrl = null;
        if (req.file) {
            // Assuming multer is configured to save files in uploads/receipts
            receiptUrl = `/uploads/receipts/${req.file.filename}`;
        }

        const newExpense = new Expense({
            employee: employeeId,
            amount,
            currency: currency || 'USD',
            category,
            expenseDate,
            description,
            receiptUrl
        });

        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(500).json({ message: 'Server error submitting expense', error: error.message });
    }
};

// Get expenses for logged-in employee
exports.getMyExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ employee: req.user._id }).sort({ createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching your expenses', error: error.message });
    }
};

// Get all expenses (For Admin / HR / Manager)
exports.getAllExpenses = async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.employee) query.employee = req.query.employee;

        // Populate employee details
        const expenses = await Expense.find(query)
            .populate('employee', 'firstName lastName _id email department designation')
            .populate('approvedBy', 'firstName lastName _id')
            .sort({ createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching all expenses', error: error.message });
    }
};

// Get single expense
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('employee', 'firstName lastName _id email')
            .populate('approvedBy', 'firstName lastName _id');
            
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        
        // Authorization check - only allow the owner or HR/Admin/Manager to view
        if (req.user.role === 'Employee' && expense.employee._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this expense' });
        }
        
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching expense', error: error.message });
    }
};

// Update expense status (Approve, Reject, Reimburse)
exports.updateExpenseStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const validStatuses = ['Pending', 'Approved', 'Rejected', 'Reimbursed'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        expense.status = status;
        if (status === 'Approved' || status === 'Rejected' || status === 'Reimbursed') {
            expense.approvedBy = req.user._id;
        }

        if (status === 'Rejected' && rejectionReason) {
            expense.rejectionReason = rejectionReason;
        }

        await expense.save();
        res.json({ message: `Expense marked as ${status}`, expense });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating expense status', error: error.message });
    }
};

// Delete expense (Only if pending)
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        if (expense.employee.toString() !== req.user._id.toString() && req.user.role === 'Employee') {
             return res.status(403).json({ message: 'Not authorized to delete this expense' });
        }

        if (expense.status !== 'Pending') {
            return res.status(400).json({ message: 'Can only delete pending expenses' });
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting expense', error: error.message });
    }
};
