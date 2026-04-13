const mongoose = require('mongoose');

// Direct connection (no SRV)
const uri = 'mongodb://123alok2032:alok2005@ac-rgyktom-shard-00-00.7spt3nq.mongodb.net,ac-rgyktom-shard-00-01.7spt3nq.mongodb.net,ac-rgyktom-shard-00-02.7spt3nq.mongodb.net/?replicaSet=atlas-f3bpiq-shard-0&ssl=true&authSource=admin&appName=expensetracker';

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✓ SUCCESS - Connected to MongoDB!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ FAILED - Error:', err.message);
    process.exit(1);
  });
