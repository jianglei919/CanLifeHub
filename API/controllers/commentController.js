// API/controllers/commentController.js
const mongoose = require('mongoose');
const Comment = require('../models/comment');
const Post = require('../models/post');

/** 工具：统一读取分页参数 */
function getPaging(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize || '20', 10), 1), 100);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, limit: pageSize };
}

/**
 * 工具：根据 “新评论的目标信息” 推断其所属的帖子 postId
 * - 顶级评论：targetType === 'post'，postId = targetId
 * - 回复：targetType === 'comment'，从父评论一路向上追溯到顶级（其 targetType === 'post'）
 */
async function findPostIdForNewComment({ targetType, targetId, parentId }) {
  try {
    if (targetType === 'post') return targetId;

    // 回复：从传入的 targetId（父评论）开始向上找
    let currentId = targetId || parentId;
    let hops = 0;

    while (currentId && hops < 5) { // 防御性：最多向上追溯 5 层
      const node = await Comment.findById(currentId).select('targetType targetId parentId').lean();
      if (!node) break;

      if (node.targetType === 'post') {
        return node.targetId;
      }

      // 继续向上：如果还有父级，就沿着 parentId 或 targetId 继续追溯
      currentId = node.parentId || node.targetId;
      hops += 1;
    }
  } catch (e) {
    console.error('[comments#findPostIdForNewComment] resolve error:', e);
  }
  return null;
}

/**
 * 工具：根据“已存在的评论文档”推断其所属的帖子 postId
 */
async function findPostIdForExistingComment(commentDoc) {
  if (!commentDoc) return null;
  if (commentDoc.targetType === 'post') return commentDoc.targetId;
  return findPostIdForNewComment({
    targetType: commentDoc.targetType,
    targetId: commentDoc.targetId,
    parentId: commentDoc.parentId,
  });
}

/** 创建评论（顶级或回复） */
exports.create = async (req, res) => {
  try {
    const { targetType = 'post', targetId, parentId = null, content, images = [] } = req.body;
    const user = req.user; // 依赖 authMiddleware 注入

    if (!user || !user.id) return res.json({ error: 'Unauthorized' });
    if (!targetId || !mongoose.isValidObjectId(targetId)) return res.json({ error: 'Invalid targetId' });
    if (!['post', 'comment'].includes(targetType)) return res.json({ error: 'Invalid targetType' });
    if (!content || !content.trim()) return res.json({ error: 'Content is required' });

    if (parentId && !mongoose.isValidObjectId(parentId)) {
      return res.json({ error: 'Invalid parentId' });
    }

    const doc = await Comment.create({
      targetType,
      targetId,
      parentId: parentId || null,
      authorId: user.id,
      content: content.trim(),
      images,
    });

    // ✅ 同步增加帖子上的评论计数（顶级评论和回复都 +1）
    try {
      const postId = await findPostIdForNewComment({ targetType, targetId, parentId });
      if (postId) {
        await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).lean();
      }
    } catch (incErr) {
      console.error('[comments#create] failed to inc Post.commentsCount:', incErr);
      // 不影响评论创建的主流程
    }

    res.json(doc);
  } catch (e) {
    console.error('[comments#create]', e);
    res.json({ error: e.message || 'Failed to create comment' });
  }
};

/** 获取某“目标”的顶级评论列表（按时间/热度），可分页 */
exports.listByTarget = async (req, res) => {
  try {
    const { targetType = 'post', targetId, sort = 'new' } = req.query;
    if (!targetId || !mongoose.isValidObjectId(targetId)) return res.json({ error: 'Invalid targetId' });
    if (!['post', 'comment'].includes(targetType)) return res.json({ error: 'Invalid targetType' });

    const { skip, limit, page, pageSize } = getPaging(req.query);

    const query = { targetType, targetId, parentId: null, status: { $ne: 'deleted' } };

    const sortSpec =
      sort === 'hot'
        ? { likesCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Comment.find(query)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email')
        .lean(),
      Comment.countDocuments(query),
    ]);

    res.json({ page, pageSize, total, items });
  } catch (e) {
    console.error('[comments#listByTarget]', e);
    res.json({ error: e.message || 'Failed to fetch comments' });
  }
};

/** 获取某评论的回复列表（分页） */
exports.listReplies = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.json({ error: 'Invalid comment id' });

    const { skip, limit, page, pageSize } = getPaging(req.query);

    const query = { parentId: id, status: { $ne: 'deleted' } };

    const [items, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email')
        .lean(),
      Comment.countDocuments(query),
    ]);

    res.json({ page, pageSize, total, items });
  } catch (e) {
    console.error('[comments#listReplies]', e);
    res.json({ error: e.message || 'Failed to fetch replies' });
  }
};

/** 编辑评论（仅作者） */
exports.update = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { content } = req.body;

    if (!user || !user.id) return res.json({ error: 'Unauthorized' });
    if (!mongoose.isValidObjectId(id)) return res.json({ error: 'Invalid comment id' });
    if (!content || !content.trim()) return res.json({ error: 'Content is required' });

    const doc = await Comment.findById(id);
    if (!doc) return res.json({ error: 'Not found' });
    if (String(doc.authorId) !== String(user.id)) return res.json({ error: 'Forbidden' });
    if (doc.status === 'deleted') return res.json({ error: 'Comment deleted' });

    doc.content = content.trim();
    doc.isEdited = true;
    doc.editedAt = new Date();

    await doc.save();
    res.json(doc);
  } catch (e) {
    console.error('[comments#update]', e);
    res.json({ error: e.message || 'Failed to update comment' });
  }
};

/** 删除评论（软删，作者或管理员） */
exports.remove = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || !user.id) return res.json({ error: 'Unauthorized' });
    if (!mongoose.isValidObjectId(id)) return res.json({ error: 'Invalid comment id' });

    const doc = await Comment.findById(id);
    if (!doc) return res.json({ error: 'Not found' });

    // 允许作者删除；如果后续有 admin 角色，可在此扩展
    if (String(doc.authorId) !== String(user.id)) return res.json({ error: 'Forbidden' });
    if (doc.status === 'deleted') return res.json({ error: 'Already deleted' });

    // ✅ 先拿到所属帖子 postId，再做软删
    let postId = null;
    try {
      postId = await findPostIdForExistingComment(doc);
    } catch (e) {
      console.error('[comments#remove] resolve postId error:', e);
    }

    doc.status = 'deleted';
    doc.content = '[deleted]';
    await doc.save();

    // ✅ 同步减少帖子上的评论计数（-1）
    if (postId) {
      try {
        await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } }).lean();
      } catch (decErr) {
        console.error('[comments#remove] failed to dec Post.commentsCount:', decErr);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[comments#remove]', e);
    res.json({ error: e.message || 'Failed to delete comment' });
  }
};