// API/routes/commentRoutes.js
const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/commentController');
const { requireAuth } = require('../helpers/authMiddleware'); // ✅ 命名导入

// 列表：获取某目标的顶级评论
// GET /api/comments?targetType=post&targetId=<id>&page=1&pageSize=20&sort=new|hot
router.get('/', ctrl.listByTarget);

// 获取某评论的回复
// GET /api/comments/:id/replies?page=1&pageSize=20
router.get('/:id/replies', ctrl.listReplies);

// 创建评论（需登录）
// POST /api/comments  body: { targetType, targetId, parentId?, content, images? }
router.post('/', requireAuth, ctrl.create);

// 编辑评论（需登录，作者本人才可）
// PATCH /api/comments/:id  body: { content }
router.patch('/:id', requireAuth, ctrl.update);

// 删除评论（软删，需登录，作者本人才可）
// DELETE /api/comments/:id
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;