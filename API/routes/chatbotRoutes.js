// API/routes/chatbotRoutes.js
// Chatbot 路由
const express = require('express');
const router = express.Router();
const { chatWithBot } = require('../controllers/chatbotController');

// CORS 由全局中间件处理（app.js），此处无需重复配置

// POST /api/chatbot/chat - 发送消息给 AI
router.post('/chat', chatWithBot);

module.exports = router;
