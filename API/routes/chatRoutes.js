// API/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../helpers/authMiddleware');
const upload = require('../helpers/upload');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  toggleBlock,
  searchUsers,
  getNewMessages,
  getConversationsUpdate,
  getReadStatusUpdates
} = require('../controllers/chatController');

// 所有路由都需要认证
router.use(requireAuth);

// 获取会话列表
router.get('/conversations', getConversations);

// 获取或创建与特定用户的会话
router.get('/conversations/:otherUserId', getOrCreateConversation);

// 获取会话中的消息
router.get('/conversations/:conversationId/messages', getMessages);

// 发送消息
router.post('/conversations/:conversationId/messages', sendMessage);

// 上传图片
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    // 返回图片的访问URL
    const imageUrl = `/uploads/chat-images/${req.file.filename}`;
    res.json({ ok: true, imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: '上传图片失败' });
  }
});

// 标记会话中的消息为已读
router.put('/conversations/:conversationId/read', markAsRead);

// 拉黑/取消拉黑用户
router.put('/conversations/:conversationId/block', toggleBlock);

// 搜索用户（用于发起新会话）
router.get('/users/search', searchUsers);

// 轮询获取新消息
router.get('/conversations/:conversationId/new-messages', getNewMessages);

// 轮询获取已读状态更新
router.get('/conversations/:conversationId/read-status', getReadStatusUpdates);

// 轮询获取会话列表更新
router.get('/conversations-update', getConversationsUpdate);

module.exports = router;

