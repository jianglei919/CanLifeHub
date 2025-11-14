// API/models/comment.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * 通用评论模型（支持挂在任意目标上：帖子/评论）
 * - targetType: 'post' | 'comment' （预留扩展）
 * - targetId:    目标对象的 _id（ObjectId）
 * - parentId:    父评论（为空表示顶级评论）
 * - authorId:    评论人
 */
const commentSchema = new Schema(
  {
    targetType: { type: String, enum: ['post', 'comment'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },

    parentId: { type: Schema.Types.ObjectId, default: null, index: true },

    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    content: { type: String, trim: true, required: true },
    images: [{ type: String }],

    likesCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['active', 'hidden', 'deleted'],
      default: 'active',
      index: true,
    },

    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 常用查询优化
commentSchema.index({ targetType: 1, targetId: 1, parentId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);