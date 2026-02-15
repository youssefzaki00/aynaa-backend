require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const connectDB = require('../config/db');

const migrateWhitelist = async () => {
  try {
    await connectDB();
    console.log('Starting whitelist migration...');
    
    const GlobalWhitelist = mongoose.model('GlobalWhitelist');
    
    // Find all items without a uuid
    const itemsWithoutUuid = await GlobalWhitelist.find({ uuid: { $exists: false } });
    
    console.log(`Found ${itemsWithoutUuid.length} items without UUID`);
    
    for (const item of itemsWithoutUuid) {
      item.uuid = crypto.randomUUID();
      await item.save();
      console.log(`Added UUID to: ${item.appName}`);
    }
    
    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

migrateWhitelist();
