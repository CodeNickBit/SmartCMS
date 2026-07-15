const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Asset = require('./models/Asset');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB.');
  
  const sampleAssets = [
    { name: 'MacBook Pro 16"', serialNumber: 'MBP-2023-001', category: 'Laptop', status: 'Available' },
    { name: 'Dell XPS 15', serialNumber: 'DX-2023-042', category: 'Laptop', status: 'Available' },
    { name: 'LG 27" 4K Monitor', serialNumber: 'LG-MON-881', category: 'Monitor', status: 'Available' },
    { name: 'Logitech MX Master 3', serialNumber: 'LOGI-M-005', category: 'Keyboard/Mouse', status: 'Available' },
    { name: 'iPhone 14 Pro', serialNumber: 'IP14-099', category: 'Mobile', status: 'Maintenance' },
    { name: 'Lenovo ThinkPad X1', serialNumber: 'LNV-X1-002', category: 'Laptop', status: 'Available' }
  ];

  for (const asset of sampleAssets) {
    const exists = await Asset.findOne({ serialNumber: asset.serialNumber });
    if (!exists) {
      await Asset.create(asset);
      console.log(`Created asset: ${asset.name}`);
    } else {
      console.log(`Asset already exists: ${asset.name}`);
    }
  }

  console.log('Seed completed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
