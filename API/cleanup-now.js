// 手动清理过期未验证用户
require('dotenv').config();
const mongoose = require('mongoose');
const { cleanupExpiredUnverifiedUsers } = require('./helpers/cleanup');

async function runCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✓ Connected to MongoDB\n');

    console.log('Starting cleanup of expired unverified users...');
    const deletedCount = await cleanupExpiredUnverifiedUsers();
    
    if (deletedCount === 0) {
      console.log('✓ No expired unverified users found');
    } else {
      console.log(`✓ Cleaned up ${deletedCount} expired unverified user(s)`);
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runCleanup();
