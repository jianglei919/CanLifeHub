const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const { requireAuth, requireAdmin } = require('../helpers/authMiddleware');

// 投放申请（需登录）
router.post('/', requireAuth, adController.submitAd);

// 广告主/管理员查看列表
router.get('/', requireAuth, adController.listAds);

// 前台展示使用的活动广告（公开）
router.get('/active', adController.getActiveAds);

// 管理员操作
router.patch('/:adId/status', requireAuth, requireAdmin, adController.updateStatus);
router.patch('/:adId/schedule', requireAuth, requireAdmin, adController.updateSchedule);
router.patch('/:adId/billing', requireAuth, requireAdmin, adController.updateBilling);

// 指标回传（无需鉴权，防止跨域问题可在前端做简单节流）
router.post('/:adId/metrics', adController.trackMetric);

module.exports = router;
