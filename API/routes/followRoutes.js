const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { requireAuth } = require('../helpers/authMiddleware');

// 所有路由都需要登录
router.use(requireAuth);

// POST /api/follow/:userId - 关注用户
router.post('/:userId', followController.follow);

// DELETE /api/follow/:userId - 取消关注
router.delete('/:userId', followController.unfollow);

// GET /api/follow/status/:userId - 检查关注状态
router.get('/status/:userId', followController.checkStatus);

// GET /api/follow/following/:userId - 获取关注列表
router.get('/following/:userId', followController.getFollowing);

// GET /api/follow/followers/:userId - 获取粉丝列表
router.get('/followers/:userId', followController.getFollowers);

module.exports = router;
