// API/index.js
const path = require('path');

// ⭐ 关键：在 require app 之前加载环境变量
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
require('dotenv').config({ path: path.join(__dirname, envFile) });
require('dotenv').config();

// 现在才 require app，此时环境变量已加载
const mongoose = require('mongoose');
const app = require('./app');
const { startCleanupSchedule } = require('./helpers/cleanup'); // 引入清理任务

const PORT = Number(process.env.PORT) || 8000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URL; // 兼容你当前变量名

mongoose.set('strictQuery', true);

async function bootstrap() {
  try {
    if (!MONGO_URI) {
      throw new Error('Missing MONGO connection string (MONGODB_URI)');
    }
    await mongoose.connect(MONGO_URI);
    console.log('[API] Mongo connected');

    // 启动定期清理过期未验证用户任务（每24小时执行一次）
    startCleanupSchedule(24);

    const server = app.listen(PORT, () => {
      console.log(`[API] listening on :${PORT}`);
    });

    /** 优雅退出 */
    const shutdown = async (signal) => {
      console.log(`[API] ${signal} received, shutting down...`);
      try {
        await new Promise((resolve) => server.close(resolve));
        await mongoose.connection.close(false);
        console.log('[API] closed mongodb connection. Bye.');
      } catch (e) {
        console.error('[API] error during shutdown:', e);
      } finally {
        process.exit(0);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (r) => console.error('[API] unhandledRejection:', r));
    process.on('uncaughtException', (e) => {
      console.error('[API] uncaughtException:', e);
      process.exit(1);
    });
  } catch (err) {
    console.error('[API] bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();