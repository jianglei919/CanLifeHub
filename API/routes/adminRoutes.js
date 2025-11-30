const express = require('express');
const { requireAuth, requireAdmin } = require('../helpers/authMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.listUsers);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.get('/posts', adminController.listPosts);
router.patch('/posts/:postId/status', adminController.updatePostStatus);
router.get('/reports', adminController.getReports);

module.exports = router;
