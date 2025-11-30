const mongoose = require('mongoose');
const User = require('../models/user');
const Post = require('../models/post');
const Advertisement = require('../models/advertisement');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function normalizePagination(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize || '20', 10), 1), 100);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

exports.getOverview = async (req, res) => {
  try {
    const now = new Date();

    const [userCount, postCount, pendingAds, runningAdsDocs, recentUsers, recentPosts, recentAds] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ status: { $ne: 'deleted' } }),
      Advertisement.countDocuments({ status: { $in: ['pending_review', 'changes_requested'] } }),
      Advertisement.find({
        'billing.paymentStatus': 'paid',
        'schedule.startAt': { $lte: now },
        'schedule.endAt': { $gte: now },
      }).select('billing totalDue schedule startAt endAt placement status title'),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('name email role verified createdAt'),
      Post.find({ status: { $ne: 'deleted' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title content status createdAt')
        .populate('authorId', 'name avatar'),
      Advertisement.find({}).sort({ createdAt: -1 }).limit(5).select('title status billing schedule advertiser createdAt'),
    ]);

    const runningAds = runningAdsDocs.length;
    const todaySpend = runningAdsDocs.reduce((sum, ad) => {
      const start = new Date(ad.schedule.startAt);
      const end = new Date(ad.schedule.endAt);
      const durationDays = Math.max(1, Math.ceil((end - start) / DAY_IN_MS));
      const avgDaily = (ad.billing?.totalDue || 0) / durationDays;
      return sum + avgDaily;
    }, 0);

    res.json({
      ok: true,
      overview: {
        userCount,
        postCount,
        pendingAds,
        runningAds,
        todaySpend: Number(todaySpend.toFixed(2)),
      },
      recent: {
        users: recentUsers,
        posts: recentPosts,
        ads: recentAds,
      },
    });
  } catch (error) {
    console.error('[admin#overview]', error);
    res.status(500).json({ error: '获取后台概览失败' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const { page, pageSize, skip } = normalizePagination(req.query);

    const filter = {};
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select('name email role verified followersCount followingCount createdAt'),
      User.countDocuments(filter),
    ]);

    res.json({ ok: true, page, pageSize, total, items });
  } catch (error) {
    console.error('[admin#listUsers]', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: '非法的角色类型' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    user.role = role;
    await user.save();

    res.json({ ok: true, user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('[admin#updateUserRole]', error);
    res.status(500).json({ error: '更新用户角色失败' });
  }
};

exports.listPosts = async (req, res) => {
  try {
    const { status, search } = req.query;
    const { page, pageSize, skip } = normalizePagination(req.query);

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { content: new RegExp(search.trim(), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select('title content status createdAt visibility likesCount commentsCount')
        .populate('authorId', 'name email'),
      Post.countDocuments(filter),
    ]);

    res.json({ ok: true, page, pageSize, total, items });
  } catch (error) {
    console.error('[admin#listPosts]', error);
    res.status(500).json({ error: '获取帖子列表失败' });
  }
};

exports.updatePostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ error: '无效的帖子ID' });
    }
    const allowedStatuses = ['active', 'hidden', 'pending', 'deleted'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: '非法的帖子状态' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    post.status = status;
    await post.save();

    res.json({ ok: true, post: { id: post._id, status: post.status } });
  } catch (error) {
    console.error('[admin#updatePostStatus]', error);
    res.status(500).json({ error: '更新帖子状态失败' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // User Growth (Last 7 days)
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top Posts (by likes)
    const topPosts = await Post.find({ status: { $ne: 'deleted' } })
      .sort({ likesCount: -1 })
      .limit(5)
      .select('title likesCount commentsCount authorId')
      .populate('authorId', 'name');

    res.json({
      ok: true,
      userGrowth,
      topPosts
    });
  } catch (error) {
    console.error('[admin#getReports]', error);
    res.status(500).json({ error: '获取报表数据失败' });
  }
};
