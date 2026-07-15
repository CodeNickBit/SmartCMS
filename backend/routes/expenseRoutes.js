const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect, isManagerOrHR } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer for receipt uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/receipts';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'receipt-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    }
});

router.use(protect);

// My expenses (Employee view)
router.get('/my-expenses', expenseController.getMyExpenses);
router.post('/', upload.single('receipt'), expenseController.submitExpense);

// Get single expense and delete
router.route('/:id')
    .get(expenseController.getExpenseById)
    .delete(expenseController.deleteExpense);

// Admin / HR / Manager routes
router.get('/', isManagerOrHR, expenseController.getAllExpenses);
router.put('/:id/status', isManagerOrHR, expenseController.updateExpenseStatus);

module.exports = router;
