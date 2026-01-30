const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveBalance = require('../models/LeaveBalance');

// Calculate balances for a user (Reusable helper)
async function calculateUserBalances(userId, year) {
    const policies = await LeavePolicy.find({ isActive: true });
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    // Get all approved leaves for this year
    const leaves = await LeaveRequest.find({
        userId,
        status: 'Approved',
        startDate: { $gte: startOfYear, $lte: endOfYear }
    });

    const results = [];

    for (const policy of policies) {
        // Calculate Used
        let used = 0;
        leaves.filter(l => l.leaveType === policy.leaveName).forEach(l => {
            // Simplified calculation assuming single year requests
            if (l.leaveUnit === 'half-day') {
                used += 0.5;
            } else {
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);
                const d = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
                used += d;
            }
        });

        const annualLimit = policy.annualLimit;
        const remaining = Math.max(0, annualLimit - used);

        // Carry Forward Logic
        let carryForward = 0;
        let encashable = 0;
        let lapsed = 0;

        if (policy.carryForwardLimit > 0) {
            carryForward = Math.min(remaining, policy.carryForwardLimit);
        }

        // Encashment Logic (if remaining leaves > carryForward)
        const remainingAfterCF = remaining - carryForward;
        if (policy.encashmentAllowed && remainingAfterCF > 0) {
            const maxEncash = policy.encashmentLimit || 999; // Default infinite if not set
            encashable = Math.min(remainingAfterCF, maxEncash);
        }

        lapsed = remaining - carryForward - encashable;

        results.push({
            userId,
            leaveType: policy.leaveName,
            year,
            openingBalance: annualLimit,
            used,
            closingBalance: remaining, // Pure closing before year-end actions
            action: {
                carryForward,
                encashed: encashable,
                lapsed
            }
        });
    }

    return results;
}

exports.previewYearEnd = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        // Fetch all generic users (employees)
        const users = await User.find({ role: { $ne: 'admin' } }).select('_id firstName lastName');

        let allResults = [];
        for (const user of users) {
            const balances = await calculateUserBalances(user._id, currentYear);
            allResults.push({
                user: { id: user._id, name: user.firstName + ' ' + user.lastName },
                balances
            });
        }

        res.json({ year: currentYear, data: allResults });

    } catch (error) {
        console.error('Preview error', error);
        res.status(500).json({ message: 'Error generating year-end preview' });
    }
};

exports.executeYearEnd = async (req, res) => {
    try {
        const { year } = req.body;
        if (!year) return res.status(400).json({ message: 'Year is required' });

        const users = await User.find({ role: { $ne: 'admin' } }).select('_id');

        let processedCount = 0;

        for (const user of users) {
            // 1. Calculate final state
            const balances = await calculateUserBalances(user._id, year);

            for (const b of balances) {
                // 2. Save Closing Record for Old Year
                const closingRecord = new LeaveBalance({
                    userId: b.userId,
                    year: year,
                    leaveType: b.leaveType,
                    openingBalance: b.openingBalance,
                    used: b.used,
                    carryForward: b.action.carryForward,
                    encashed: b.action.encashed,
                    lapsed: b.action.lapsed,
                    closingBalance: b.closingBalance
                });
                await closingRecord.save();

                // 3. Create Opening Record for New Year (Optional - usually inferred from Policy + CarryForward)
                // This ensures the carry forward is actually available next year.
                // We might need a "CarryForwardBalance" collection or adjust Policy dynamically (complex).
                // For now, we will store it. Future 'applyForLeave' logic should check this 'LeaveBalance' for previous year CF.
            }
            processedCount++;
        }

        res.json({ message: `Successfully processed year-end for ${processedCount} employees`, year });

    } catch (error) {
        console.error('Execution error', error);
        res.status(500).json({ message: 'Error executing year-end process' });
    }
};
