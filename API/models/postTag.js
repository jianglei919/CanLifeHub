// models/PostTag.js
const mongoose = require('mongoose');

const postTagSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建复合索引以提高查询性能
postTagSchema.index({ postId: 1, topic: 1 });
postTagSchema.index({ topic: 1, createdAt: -1 });

module.exports = mongoose.model('PostTag', postTagSchema);