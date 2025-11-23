const mongoose = require('mongoose');
const { Schema } = mongoose;

const followSchema = new Schema(
    {
        followerId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true,
            index: true 
        }, // 关注者
        followingId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true,
            index: true 
        }, // 被关注者
    },
    { timestamps: true }
);

// 复合唯一索引：防止重复关注
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// 索引优化：查询某用户的关注列表
followSchema.index({ followerId: 1, createdAt: -1 });

// 索引优化：查询某用户的粉丝列表
followSchema.index({ followingId: 1, createdAt: -1 });

module.exports = mongoose.model('Follow', followSchema);
