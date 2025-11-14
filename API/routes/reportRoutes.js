const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/reportController');
const { requireAuth } = require('../helpers/authMiddleware'); // 引入认证中间件

// ===================================
// 举报
// ===================================

// 创建举报（需登录）
// POST /api/reports Body: { entityType: 'post'|'comment'|'user', entityId, reason }
router.post('/', requireAuth, ctrl.create);


module.exports = router;