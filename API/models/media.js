const mongoose = require('mongoose');
const { Schema } = mongoose;

const mediaSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    // 文件信息
    filename: { type: String },
    originalName: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    // 视频特有字段
    duration: { type: Number, default: null },
    cover: { type: Boolean, default: false }, // 是否为封面
    // 图片/视频通用字段
    width: { type: Number, default: null },
    height: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);