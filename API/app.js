// API/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// 路由
const authRoutes = require('./routes/authRoutes'); // 内部路由应写成 /register /login 这种相对路径
//todo: 新增路由放在这里！！！！

const app = express();

/** 基础中间件 */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/** CORS（开发期：前端通过 Vite 代理即可；若直连也能工作） */
const allowList = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());
app.use(cors({ origin: allowList, credentials: true }));

/** 健康检查 */
app.get('/healthz', (req, res) => res.status(200).send('ok'));

/** 业务路由（统一前缀） */
app.use('/api/auth', authRoutes);
//todo: 新增接口均以api开头放在这里！！！！

/** 404 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

/** 全局错误处理 */
app.use((err, req, res, next) => {
  console.error('[API] Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;