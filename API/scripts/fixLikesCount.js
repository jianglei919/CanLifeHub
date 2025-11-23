require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/post');
const Reaction = require('../models/reaction');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URL;

async function fixLikesCount() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 获取所有帖子
        const posts = await Post.find({});
        console.log(`📊 Found ${posts.length} posts`);

        let fixedCount = 0;

        for (const post of posts) {
            // 统计该帖子的真实点赞数
            const actualLikesCount = await Reaction.countDocuments({
                postId: post._id,
                type: 'like'
            });

            // 如果数据库中的 likesCount 与真实点赞数不一致，则更新
            if (post.likesCount !== actualLikesCount) {
                console.log(`🔧 Fixing post ${post._id}: ${post.likesCount} -> ${actualLikesCount}`);
                await Post.findByIdAndUpdate(post._id, {
                    $set: { likesCount: actualLikesCount }
                });
                fixedCount++;
            }
        }

        console.log(`✅ Fixed ${fixedCount} posts`);
        console.log('🎉 Done!');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixLikesCount();
