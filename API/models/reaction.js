const mongoose = require('mongoose');
const { Schema } = mongoose;

const reactionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
        type: { type: String, enum: ['like', 'favorite', 'share'], required: true },
    },
    { timestamps: true }
);

// 确保每个用户对同一帖子同一类型只能有一个互动记录
reactionSchema.index({ userId: 1, postId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);