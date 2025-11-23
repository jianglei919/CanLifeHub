// Mongoose 用户模型
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' }, // 个人简介
  avatar: { type: String, default: '' }, // 头像URL
  followersCount: { type: Number, default: 0 }, // 粉丝数
  followingCount: { type: Number, default: 0 }, // 关注数
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;