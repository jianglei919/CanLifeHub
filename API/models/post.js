const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema(
    {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        type: { type: String, enum: ['image', 'video', 'text'], required: true }, // 图文/短视频/纯文本
        
        title: { type: String, trim: true, default: '' },
        content: { type: String, trim: true, default: '' },
        
        // 互动计数
        likesCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        favoritesCount: { type: Number, default: 0 },
        sharesCount: { type: Number, default: 0 },

        // 标签、话题、地点（使用字符串数组简化，实际应用中可单独建表）
        tags: [{ type: String }], 
        topics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }], 
        poiId: { type: String, default: null }, // 地点 POI ID

        // 可见性控制
        visibility: { 
            type: String, 
            enum: ['public', 'followers', 'private', 'draft'], 
            default: 'public' 
        },

        // 状态管理
        status: {
            type: String,
            enum: ['active', 'pending', 'hidden', 'deleted'],
            default: 'active',
            index: true,
        },
    },
    { timestamps: true } // created_at 和 updated_at
);

// 索引优化：用于新鲜度/热度流
postSchema.index({ status: 1, visibility: 1, createdAt: -1 }); // 新鲜度流
postSchema.index({ status: 1, visibility: 1, likesCount: -1, createdAt: -1 }); // 热度流

module.exports = mongoose.model('Post', postSchema);