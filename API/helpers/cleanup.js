// 定期清理过期未验证用户
const User = require('../models/user');

/**
 * 删除所有验证码已过期且未验证的用户
 * 建议每小时或每天运行一次
 */
async function cleanupExpiredUnverifiedUsers() {
  try {
    const result = await User.deleteMany({
      verified: false,
      verificationTokenExpiry: { $lt: Date.now() }, // 验证码已过期
    });
    
    if (result.deletedCount > 0) {
      console.log(`[cleanup] Deleted ${result.deletedCount} expired unverified users`);
    }
    return result.deletedCount;
  } catch (error) {
    console.error('[cleanup] Error cleaning up expired users:', error);
    throw error;
  }
}

/**
 * 启动定时清理任务
 * @param {number} intervalHours - 清理间隔（小时）
 */
function startCleanupSchedule(intervalHours = 24) {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // 立即执行一次
  cleanupExpiredUnverifiedUsers();
  
  // 定期执行
  setInterval(() => {
    cleanupExpiredUnverifiedUsers();
  }, intervalMs);
  
  console.log(`[cleanup] Scheduled cleanup every ${intervalHours} hours`);
}

module.exports = {
  cleanupExpiredUnverifiedUsers,
  startCleanupSchedule,
};
