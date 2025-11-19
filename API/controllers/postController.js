const mongoose = require('mongoose');
const Post = require('../models/post');
const PostTag = require('../models/postTag');
const Media = require('../models/media');
const Reaction = require('../models/reaction');
// 假设您有 authMiddleware 注入 req.user 和 uploadMiddleware 处理文件

/** 辅助函数：统一读取分页参数 (与 commentController 中相同) */
function getPaging(query) {
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(query.pageSize || '20', 10), 1), 100);
    const skip = (page - 1) * pageSize;
    return { page, pageSize, skip, limit: pageSize };
}


/** POST /posts - 发布帖子 */
exports.create = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });

        const { content, visibility, location, topics, mentions, coverIndex, mediaUrls } = req.body;
        
        // 验证必填字段
        if (!content && (!mediaUrls || mediaUrls.length === 0)) {
            return res.status(400).json({ error: '内容和媒体文件不能都为空' });
        }

        // 确定帖子类型
        let type = 'text';
        if (mediaUrls && mediaUrls.length > 0) {
            const hasVideo = mediaUrls.some(media => media.type === 'video');
            type = hasVideo ? 'video' : 'image';
        }

        // 解析数组字段
        const topicsArray = topics ? (topics) : [];
        const mentionsArray = mentions ? (mentions) : [];
        const coverIndexNum = coverIndex ? parseInt(coverIndex) : 0;
        const mediaUrlsArray = mediaUrls || [];

        // 创建帖子
        const newPost = await Post.create({
            authorId: user.id,
            type,
            title: '', // 前端没有标题字段
            content: content || '',
            visibility: visibility || 'public',
            status: 'active',
            poiId: location,
            createdAt: new Date()
        });

        // 处理媒体文件
        if (mediaUrlsArray.length > 0) {
            const mediaDocs = mediaUrlsArray.map((media, index) => {
                const isCover = index === coverIndexNum;
                
                return {
                    postId: newPost._id,
                    url: media.url,
                    type: media.type,
                    cover: isCover,
                    width: media.width || 0,
                    height: media.height || 0,
                    duration: media.duration || null,
                    filename: media.filename,
                    originalName: media.originalName,
                    mimetype: media.mimetype,
                    size: media.size
                };
            });
            
            await Media.insertMany(mediaDocs);
        }


        // 处理位置信息
        // if (location) {
        //     // 这里需要根据位置名称查找或创建POI
        //     // 暂时简单处理
        //     await PostLocation.create({
        //         postId: newPost._id,
        //         poiId: null, // 实际项目中需要POI系统
        //         locationName: location
        //     });
        // }

        // 处理话题标签
        if (topicsArray.length > 0) {
            const topicDocs = topicsArray.map(topic => ({
                postId: newPost._id,
                topic: topic
            }));
            await PostTag.insertMany(topicDocs);
        }

        // 处理@用户
        // if (mentionsArray.length > 0) {
        //     // 这里需要根据用户名查找用户ID
        //     // 暂时简单处理
        //     const mentionDocs = mentionsArray.map(mention => ({
        //         postId: newPost._id,
        //         mentionedUser: mention // 实际项目中应该是用户ID
        //     }));
        //     await PostMention.insertMany(mentionDocs);
        // }

        // 返回完整的帖子数据（包含关联数据）
        const populatedPost = await Post.findById(newPost._id)
            .populate('authorId', 'username avatar')
            .populate('poiId')
            .populate('tags');

        res.status(201).json({
            success: true,
            data: populatedPost
        });
    } catch (e) {
        console.error('[posts#create]', e);
        res.status(500).json({ 
            success: false,
            error: e.message || 'Failed to create post' 
        });
    }
};

/** PATCH /posts/{id} - 编辑帖子 */
exports.update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updates = req.body;

        if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid post id' });

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (String(post.authorId) !== String(user.id)) return res.status(403).json({ error: 'Forbidden' });

        // 只允许更新部分字段
        const allowedUpdates = ['title', 'content', 'visibility', 'tags', 'topics', 'poiId', 'status'];
        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) {
                post[key] = updates[key];
            }
        });

        await post.save();
        res.json(post);
    } catch (e) {
        console.error('[posts#update]', e);
        res.status(500).json({ error: e.message || 'Failed to update post' });
    }
};

/** DELETE /posts/{id} - 软删除帖子 */
exports.remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid post id' });

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // 仅作者可删除
        if (String(post.authorId) !== String(user.id)) return res.status(403).json({ error: 'Forbidden' });

        post.status = 'deleted';
        await post.save();

        res.json({ ok: true, message: 'Post soft-deleted' });
    } catch (e) {
        console.error('[posts#remove]', e);
        res.status(500).json({ error: e.message || 'Failed to delete post' });
    }
};

/** GET /posts/{id} - 获取单个帖子详情 */
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid post id' });

        const post = await Post.findById(id)
            .populate('authorId', 'name avatar') // 填充作者信息
            .lean(); 

        if (!post || post.status === 'deleted') return res.status(404).json({ error: 'Post not found' });

        // 获取媒体文件
        const media = await Media.find({ postId: id }).lean();
        
        // 组装返回数据 (TODO: 检查可见性权限)
        res.json({ ...post, media });
    } catch (e) {
        console.error('[posts#getById]', e);
        res.status(500).json({ error: e.message || 'Failed to fetch post' });
    }
};

/** GET /users/{id}/posts - 获取用户发布的帖子列表 */
exports.listByUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id' });

        const { skip, limit, page, pageSize } = getPaging(req.query);

        const query = { 
            authorId: id, 
            status: 'active',
            visibility: { $in: ['public', 'followers'] } // 简化：只返回公开和粉丝可见的
        };

        const [items, total] = await Promise.all([
            Post.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Post.countDocuments(query),
        ]);

        res.json({ page, pageSize, total, items });
    } catch (e) {
        console.error('[posts#listByUser]', e);
        res.status(500).json({ error: e.message || 'Failed to fetch user posts' });
    }
};

/** POST /posts/{id}/react - 帖子互动（点赞/收藏/分享） */
exports.react = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { type } = req.body; // type: 'like' | 'favorite' | 'share'

        if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid post id' });
        if (!['like', 'favorite', 'share'].includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });

        const postId = new mongoose.Types.ObjectId(id);
        const userId = user.id;

        // 查找或创建 Reaction
        const reaction = await Reaction.findOneAndUpdate(
            { postId, userId, type },
            { $set: { userId, postId, type } },
            { upsert: true, new: true, runValidators: true }
        );

        // 更新计数器（原子操作）
        let updateField;
        if (type === 'like') updateField = 'likesCount';
        else if (type === 'favorite') updateField = 'favoritesCount';
        else if (type === 'share') updateField = 'sharesCount';

        await Post.findByIdAndUpdate(postId, { $inc: { [updateField]: 1 } });
        
        res.json({ ok: true, reaction });
    } catch (e) {
        // E11000 错误表示重复创建，但我们使用了 findOneAndUpdate(upsert: true) 应该能避免
        console.error('[posts#react]', e);
        res.status(500).json({ error: e.message || 'Failed to react to post' });
    }
};

/** DELETE /posts/{id}/react - 取消互动 */
exports.unreact = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { type } = req.query; // type: 'like' | 'favorite' | 'share'

        if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid post id' });
        if (!['like', 'favorite', 'share'].includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });
        
        const postId = new mongoose.Types.ObjectId(id);
        const userId = user.id;

        // 删除 Reaction 记录
        const result = await Reaction.deleteOne({ postId, userId, type });

        if (result.deletedCount > 0) {
            // 更新计数器（原子操作）
            let updateField;
            if (type === 'like') updateField = 'likesCount';
            else if (type === 'favorite') updateField = 'favoritesCount';
            else if (type === 'share') updateField = 'sharesCount';
            
            await Post.findByIdAndUpdate(postId, { $inc: { [updateField]: -1 } });
        }

        res.json({ ok: true });
    } catch (e) {
        console.error('[posts#unreact]', e);
        res.status(500).json({ error: e.message || 'Failed to unreact to post' });
    }
};