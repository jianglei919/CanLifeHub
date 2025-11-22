const Post = require('../models/post');
const Media = require('../models/media')
// 假设您有 Follow 模型和辅助函数用于获取用户关注列表

/** 辅助函数：将 page/pageSize 转换为 cursor/limit */
function getCursorPaging(query) {
    const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
    const cursor = query.cursor || new Date().toISOString(); // 默认使用当前时间作为游标
    return { limit, cursor };
}

/** GET /feed/follow - 关注流 */
exports.followFeed = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });

        const { limit, cursor } = getCursorPaging(req.query);
        
        // 1. 假设您有一个服务能获取用户关注的所有作者 ID 列表
        // const followedUserIds = await FollowService.getFollowingIds(user.id);
        const followedUserIds = []; // 替换为实际获取的 ID 列表

        const query = {
            authorId: { $in: followedUserIds },
            status: 'active',
            visibility: { $in: ['public', 'followers'] }, // 仅公开或粉丝可见
            ...(cursor && { createdAt: { $lt: new Date(cursor) } }) // 分页游标
        };

        const items = await Post.find(query)
            .sort({ createdAt: -1 }) // 按新鲜度排序
            .limit(limit + 1) // 多取一条判断是否有下一页
            .populate('authorId', 'name avatar')
            .lean();

        // 获取所有帖子的媒体文件
        const postIds = items.map(item => item._id);
        const mediaFiles = await Media.find({ 
            postId: { $in: postIds } 
        }).lean();

        // 将媒体文件按 postId 分组
        const mediaByPostId = {};
        mediaFiles.forEach(media => {
            if (!mediaByPostId[media.postId]) {
                mediaByPostId[media.postId] = [];
            }
            mediaByPostId[media.postId].push({
                url: media.url,
                type: media.type, // 'image' 或 'video'
                thumbnail: media.thumbnail // 如果有缩略图的话
            });
        });

        // 将媒体文件添加到对应的帖子中
        const itemsWithMedia = items.map(item => ({
            ...item,
            media: mediaByPostId[item._id] || []
        }));

        const hasNext = itemsWithMedia.length > limit;
        const nextCursor = hasNext ? itemsWithMedia[limit - 1].createdAt.toISOString() : null;

        res.json({ items: itemsWithMedia.slice(0, limit), nextCursor });

    } catch (e) {
        console.error('[feed#follow]', e);
        res.status(500).json({ error: e.message || 'Failed to fetch follow feed' });
    }
};

/** GET /feed/recommend - 推荐流（规则版：新鲜度+互动热度） */
exports.recommendFeed = async (req, res) => {
    try {
        const { limit, cursor } = getCursorPaging(req.query);
        
        // 推荐流的查询逻辑：混合新鲜度（时间）和互动热度（likesCount）
        const query = {
            status: 'active',
            visibility: 'public', // 推荐流只看公开内容
            ...(cursor && { createdAt: { $lt: new Date(cursor) } }) // 分页游标
        };
        
        const sortSpec = { 
            likesCount: -1, // 互动热度优先
            createdAt: -1  // 其次按新鲜度
        };

        const items = await Post.find(query)
            .sort(sortSpec)
            .limit(limit + 1)
            .populate('authorId', 'name avatar')
            .lean();

        // 获取所有帖子的媒体文件
        const postIds = items.map(item => item._id);
        const mediaFiles = await Media.find({ 
            postId: { $in: postIds } 
        }).lean();

        // 将媒体文件按 postId 分组
        const mediaByPostId = {};
        mediaFiles.forEach(media => {
            if (!mediaByPostId[media.postId]) {
                mediaByPostId[media.postId] = [];
            }
            mediaByPostId[media.postId].push({
                url: media.url,
                type: media.type, // 'image' 或 'video'
                thumbnail: media.thumbnail // 如果有缩略图的话
            });
        });

        // 将媒体文件添加到对应的帖子中
        const itemsWithMedia = items.map(item => ({
            ...item,
            media: mediaByPostId[item._id] || []
        }));

        const hasNext = itemsWithMedia.length > limit;
        const nextCursor = hasNext ? itemsWithMedia[limit - 1].createdAt.toISOString() : null;

        res.json({ items: itemsWithMedia.slice(0, limit), nextCursor });

    } catch (e) {
        console.error('[feed#recommend]', e);
        res.status(500).json({ error: e.message || 'Failed to fetch recommendation feed' });
    }
};