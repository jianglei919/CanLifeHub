// API/controllers/commentController.js
const mongoose = require('mongoose');
const Comment = require('../models/comment');

/** 工具：统一读取分页参数 */
function getPaging(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize || '20', 10), 1), 100);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, limit: pageSize };
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

    doc.status = 'deleted';
    doc.content = '[deleted]';
    await doc.save();

    res.json({ ok: true });
  } catch (e) {
    console.error('[comments#remove]', e);
    res.json({ error: e.message || 'Failed to delete comment' });
  }
};