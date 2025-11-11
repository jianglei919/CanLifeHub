// API/index.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

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

    const server = app.listen(PORT, () => {
      console.log(`[API] listening on :${PORT}`);
    });

    /** 优雅退出 */
    const shutdown = (signal) => {
      console.log(`[API] ${signal} received, shutting down...`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('[API] closed mongodb connection. Bye.');
          process.exit(0);
        });
      });
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