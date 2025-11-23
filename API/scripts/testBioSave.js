require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

const MONGODB_URI = process.env.MONGODB_URL;

async function testBioSave() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 找一个用户
        const user = await User.findOne({ verified: true });
        
        if (!user) {
            console.log('❌ 没有找到已验证的用户');
            process.exit(1);
        }

        console.log('📝 测试用户:', user.name);
        console.log('📝 当前bio:', user.bio || '(空)');
        
        // 更新bio
        const newBio = `测试简介 - ${new Date().toLocaleTimeString()}`;
        user.bio = newBio;
        await user.save();
        
        console.log('✅ 保存成功\n');
        
        // 重新查询验证
        const updatedUser = await User.findById(user._id);
        console.log('📝 验证查询后的bio:', updatedUser.bio);
        
        if (updatedUser.bio === newBio) {
            console.log('✅ Bio 保存验证成功！');
        } else {
            console.log('❌ Bio 保存验证失败！');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

testBioSave();
