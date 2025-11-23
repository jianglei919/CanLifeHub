const Follow = require('../models/follow');
const User = require('../models/user');
const mongoose = require('mongoose');

/** POST /follow/:userId - 关注用户 */
exports.follow = async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser || !currentUser.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const followingId = new mongoose.Types.ObjectId(userId);
        const followerId = new mongoose.Types.ObjectId(currentUser.id);

        // 不能关注自己
        if (followerId.equals(followingId)) {
            return res.status(400).json({ error: '不能关注自己' });
        }

        // 检查目标用户是否存在
        const targetUser = await User.findById(followingId);
        if (!targetUser) {
            return res.status(404).json({ error: '目标用户不存在' });
        }

        // 检查是否已经关注
        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (existingFollow) {
            return res.status(400).json({ error: '已经关注过该用户' });
        }

        // 创建关注记录
        await Follow.create({ followerId, followingId });

        // 更新统计数据
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
        await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

        res.json({ ok: true, message: '关注成功' });
    } catch (error) {
        // 处理唯一索引冲突（重复关注）
        if (error.code === 11000) {
            return res.status(400).json({ error: '已经关注过该用户' });
        }
        console.error('[follow#follow]', error);
        res.status(500).json({ error: error.message || '关注失败' });
    }
};

/** DELETE /follow/:userId - 取消关注 */
exports.unfollow = async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser || !currentUser.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const followingId = new mongoose.Types.ObjectId(userId);
        const followerId = new mongoose.Types.ObjectId(currentUser.id);

        // 删除关注记录
        const result = await Follow.deleteOne({ followerId, followingId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: '未关注该用户' });
        }

        // 更新统计数据
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });

        res.json({ ok: true, message: '取消关注成功' });
    } catch (error) {
        console.error('[follow#unfollow]', error);
        res.status(500).json({ error: error.message || '取消关注失败' });
    }
};

/** GET /follow/status/:userId - 检查是否关注某用户 */
exports.checkStatus = async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser || !currentUser.id) {
            return res.json({ isFollowing: false });
        }

        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const followingId = new mongoose.Types.ObjectId(userId);
        const followerId = new mongoose.Types.ObjectId(currentUser.id);

        const follow = await Follow.findOne({ followerId, followingId });
        
        res.json({ isFollowing: !!follow });
    } catch (error) {
        console.error('[follow#checkStatus]', error);
        res.status(500).json({ error: error.message || '检查关注状态失败' });
    }
};

/** GET /follow/following/:userId - 获取某用户的关注列表 */
exports.getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 100);

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const followerId = new mongoose.Types.ObjectId(userId);
        const skip = (page - 1) * pageSize;

        const [items, total] = await Promise.all([
            Follow.find({ followerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .populate('followingId', 'name avatar bio followersCount followingCount')
                .lean(),
            Follow.countDocuments({ followerId })
        ]);

        const users = items.map(item => item.followingId);

        res.json({
            users,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('[follow#getFollowing]', error);
        res.status(500).json({ error: error.message || '获取关注列表失败' });
    }
};

/** GET /follow/followers/:userId - 获取某用户的粉丝列表 */
exports.getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 100);

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const followingId = new mongoose.Types.ObjectId(userId);
        const skip = (page - 1) * pageSize;

        const [items, total] = await Promise.all([
            Follow.find({ followingId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .populate('followerId', 'name avatar bio followersCount followingCount')
                .lean(),
            Follow.countDocuments({ followingId })
        ]);

        const users = items.map(item => item.followerId);

        res.json({
            users,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('[follow#getFollowers]', error);
        res.status(500).json({ error: error.message || '获取粉丝列表失败' });
    }
};
