// helpers/uploadAdapter.js
// 根据环境选择本地磁盘存储（开发）或 Cloudinary（生产）

const isProd = process.env.NODE_ENV === 'production';

// 本地存储（multer 磁盘）
const localAvatarUpload = require('./uploadAvatar');
const localPostMediaUpload = require('./uploadPostMedia');
const localChatImageUpload = require('./upload');

// 云存储（Cloudinary）
const cloudinaryUploads = require('./cloudinaryUpload');

const avatarUpload = isProd ? cloudinaryUploads.avatarUpload : localAvatarUpload;
const postMediaUpload = isProd ? cloudinaryUploads.postMediaUpload : localPostMediaUpload;
const chatImageUpload = isProd ? cloudinaryUploads.chatImageUpload : localChatImageUpload;

module.exports = {
  avatarUpload,
  postMediaUpload,
  chatImageUpload,
};