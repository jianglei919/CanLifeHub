require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/post');
const Reaction = require('../models/reaction');
const User = require('../models/user');

const MONGODB_URI = process.env.MONGODB_URL;

async function checkPostsData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 获取所有活跃帖子，按点赞数降序排列
        const posts = await Post.find({ status: 'active' })
            .sort({ likesCount: -1, createdAt: -1 })
            .populate('authorId', 'name')
            .lean();

        console.log('📊 帖子列表（按点赞数降序）：\n');
        console.log('序号 | 标题 | 作者 | 点赞数 | 创建时间');
        console.log('-----|------|------|--------|----------');

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            const actualLikes = await Reaction.countDocuments({
                postId: post._id,
                type: 'like'
            });
            
            const title = post.title || post.content?.substring(0, 20) || '(无标题)';
            const author = post.authorId?.name || 'Unknown';
            const dateStr = new Date(post.createdAt).toLocaleString('zh-CN');
            
            console.log(`${i + 1}. | ${title} | ${author} | ${post.likesCount} (实际:${actualLikes}) | ${dateStr}`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkPostsData();
