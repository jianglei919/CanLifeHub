// API/routes/chatbotRoutes.js
// Chatbot 路由
const express = require('express');
const router = express.Router();
const cors = require('cors');
const { chatWithBot } = require('../controllers/chatbotController');

// CORS 中间件
router.use(
  cors({
    credentials: true,
    origin: 'http://localhost:5173'
  })
);

// POST /api/chatbot/chat - 发送消息给 AI
router.post('/chat', chatWithBot);

module.exports = router;
