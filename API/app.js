// API/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// 路由
const authRoutes = require('./routes/authRoutes'); // 内部路由应写成 /register /login 这种相对路径
const chatRoutes = require('./routes/chatRoutes'); // 聊天路由
const commentRoutes = require('./routes/commentRoutes'); // 评论路由
const chatbotRoutes = require('./routes/chatbotRoutes'); // AI Chatbot 路由
// ==== 帖子 ===
const postRoutes = require('./routes/postRoutes');
const feedRoutes = require('./routes/feedRoutes');
const reportRoutes = require('./routes/reportRoutes');
// =============
//todo: 新增路由放在这里！！！！

const app = express();

/** 基础中间件 */
app.use(express.json({ limit: '50mb' })); // 增加JSON请求体大小限制，支持Base64图片
app.use(express.urlencoded({ extended: false, limit: '50mb' })); // 增加URL编码请求体大小限制
app.use(cookieParser());

/** 静态文件服务（用于访问上传的图片） */
app.use('/uploads', express.static('uploads'));

/** CORS（开发期：前端通过 Vite 代理即可；若直连也能工作） */
const allowList = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());
app.use(cors({ origin: allowList, credentials: true }));

/** 健康检查 */
app.get('/healthz', (req, res) => res.status(200).send('ok'));

/** 业务路由（统一前缀） */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/reports', reportRoutes);
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