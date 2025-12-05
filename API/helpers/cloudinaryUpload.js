// API/helpers/cloudinaryUpload.js
// Cloudinary 对象存储集成（替代本地 uploads/ 目录）
// 使用前需要：npm install cloudinary multer-storage-cloudinary

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 配置 Cloudinary（从环境变量读取）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 头像上传配置
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'canlifehub/avatars', // Cloudinary 中的文件夹
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // 自动裁剪
    public_id: (req, file) => `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
});

// 帖子媒体上传配置
const postMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: isVideo ? 'canlifehub/posts/videos' : 'canlifehub/posts/images',
      allowed_formats: isVideo ? ['mp4', 'mov', 'avi'] : ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      resource_type: isVideo ? 'video' : 'image',
      transformation: isVideo ? [] : [{ width: 1200, height: 1200, crop: 'limit' }],
      public_id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
});

// 聊天图片上传配置
const chatImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'canlifehub/chat-images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    public_id: (req, file) => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
});

// 导出 multer 中间件
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB 限制
});

const postMediaUpload = multer({
  storage: postMediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 限制
});

const chatImageUpload = multer({
  storage: chatImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 限制
});

module.exports = {
  cloudinary,
  avatarUpload,
  postMediaUpload,
  chatImageUpload
};
