require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/post');
const Media = require('../models/media');

const MONGODB_URI = process.env.MONGODB_URL;

async function checkMediaStorage() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 查找最近的帖子
        const recentPost = await Post.findOne({ status: 'active' }).sort({ createdAt: -1 });
        
        if (!recentPost) {
            console.log('❌ 没有找到帖子');
            process.exit(1);
        }

        console.log('📝 最近的帖子:');
        console.log('   ID:', recentPost._id);
        console.log('   标题:', recentPost.title);
        console.log('   作者ID:', recentPost.authorId);
        console.log('   类型:', recentPost.type);
        console.log('   创建时间:', recentPost.createdAt);
        console.log();

        // 查找该帖子的媒体文件
        const mediaFiles = await Media.find({ postId: recentPost._id });
        
        if (mediaFiles.length === 0) {
            console.log('ℹ️  该帖子没有媒体文件');
        } else {
            console.log(`📷 媒体文件 (${mediaFiles.length} 个):`);
            mediaFiles.forEach((media, index) => {
                console.log(`\n   媒体 ${index + 1}:`);
                console.log('   - URL:', media.url);
                console.log('   - 类型:', media.type);
                console.log('   - 文件名:', media.filename);
                console.log('   - 原始名:', media.originalName);
                console.log('   - MIME类型:', media.mimetype);
                console.log('   - 大小:', media.size ? `${(media.size / 1024).toFixed(2)} KB` : 'N/A');
                console.log('   - 是否封面:', media.cover || false);
            });
        }

        console.log('\n✅ 检查完成！');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkMediaStorage();
