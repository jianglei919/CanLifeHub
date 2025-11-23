// API/routes/feedRoutes.js
const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/feedController');
const { requireAuth } = require('../helpers/authMiddleware'); // 引入认证中间件

// ===================================
// 动态流
// ===================================

// 关注流（需登录，支持游标分页）
// GET /api/feed/follow?limit=20&cursor=<timestamp>
router.get('/follow', requireAuth, ctrl.followFeed);

// 推荐流（支持游标分页）
// GET /api/feed/recommend?limit=20&cursor=<timestamp>
router.get('/recommend', ctrl.recommendFeed);


module.exports = router;