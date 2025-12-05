// API/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

/** 基础中间件 */
app.use(express.json({ limit: '50mb' })); // 增加JSON请求体大小限制，支持Base64图片
app.use(express.urlencoded({ extended: false, limit: '50mb' })); // 增加URL编码请求体大小限制
app.use(cookieParser());

/** 禁用缓存（防止 304 Not Modified 错误）*/
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

/** 静态文件服务（用于访问上传的图片） */
app.use('/uploads', express.static('uploads'));

/** CORS */
// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
//todo: 新增路由放在这里！！！！

/** 健康检查 */
app.get('/healthz', (req, res) => res.status(200).send('ok'));

const authRoutes = require('./routes/authRoutes'); // 内部路由应写成 /register /login 这种相对路径
const chatRoutes = require('./routes/chatRoutes'); // 聊天路由
const commentRoutes = require('./routes/commentRoutes'); // 评论路由
const chatbotRoutes = require('./routes/chatbotRoutes'); // AI Chatbot 路由
// ==== 帖子 ===
const postRoutes = require('./routes/postRoutes');
const feedRoutes = require('./routes/feedRoutes');
const reportRoutes = require('./routes/reportRoutes');
const followRoutes = require('./routes/followRoutes'); // 关注路由
const adRoutes = require('./routes/adRoutes'); // 广告投放路由
const adminRoutes = require('./routes/adminRoutes'); // 后台管理路由
// =============

/** 业务路由（统一前缀） */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/admin', adminRoutes);
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