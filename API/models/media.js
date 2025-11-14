const mongoose = require('mongoose');
const { Schema } = mongoose;

const mediaSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    // 视频特有字段
    duration: { type: Number, default: null },
    cover: { type: String, default: null }, // 视频封面 URL
    // 图片/视频通用字段
    width: { type: Number, default: null },
    height: { type: Number, default: null },
});

module.exports = mongoose.model('Media', mediaSchema);