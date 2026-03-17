require('dotenv').config();
const mongoose = require('mongoose');
const LeavePolicy = require('./models/LeavePolicy');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const policies = await LeavePolicy.find({});
        console.log('All Policies:');
        policies.forEach(p => console.log(`- ${p.leaveName} (Limit: ${p.annualLimit}) [ID: ${p._id}]`));

        // Group by lowercased name
        const grouped = {};
        for (const p of policies) {
            const key = p.leaveName.toLowerCase();
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(p);
        }

        for (const key in grouped) {
            if (grouped[key].length > 1) {
                console.log(`\nFound duplicate for ${key}!!`);
                // Keep the first one with the highest limit or just the first one
                const toKeep = grouped[key][0];
                const toDelete = grouped[key].slice(1);
                for (const del of toDelete) {
                    console.log(`Deleting duplicate: ${del.leaveName} with limit ${del.annualLimit}`);
                    await LeavePolicy.findByIdAndDelete(del._id);
                }
            }
        }
        
        console.log('Cleanup complete.');
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
});
