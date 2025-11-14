const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/postController');
const { requireAuth } = require('../helpers/authMiddleware');
// const uploadMiddleware = require('../helpers/uploadMiddleware'); // 暂时注释掉，避免模块找不到的错误

// ===================================
// 帖子 CRUD
// ===================================

// 发布帖子（需登录，支持多图/视频上传）
// POST /api/posts 
// Body: { type, title?, content, visibility, tags?, topics?, poiId?, mediaUrls? }
// 实际应用中，媒体文件需经过 uploadMiddleware 处理
// router.post('/', requireAuth, uploadMiddleware.array('media', 9), ctrl.create); // 暂时注释原代码
router.post('/', requireAuth, ctrl.create);

// 编辑帖子（需登录，作者本人）
// PATCH /api/posts/:id Body: { content?, title?, visibility? ... }
router.patch('/:id', requireAuth, ctrl.update);

// 删除帖子（软删，需登录，作者本人）
// DELETE /api/posts/:id
router.delete('/:id', requireAuth, ctrl.remove);

// 获取单个帖子详情
// GET /api/posts/:id
router.get('/:id', ctrl.getById);

// 获取某用户的帖子列表
// GET /api/users/:id/posts?page=1&pageSize=20
router.get('/users/:id/posts', ctrl.listByUser);


// ===================================
// 互动（点赞、收藏、分享）
// ===================================

// 创建互动（点赞/收藏/分享，需登录）
// POST /api/posts/:id/react Body: { type: 'like'|'favorite'|'share' }
router.post('/:id/react', requireAuth, ctrl.react);

// 取消互动（需登录）
// DELETE /api/posts/:id/react?type=like|favorite|share
router.delete('/:id/react', requireAuth, ctrl.unreact);


module.exports = router;