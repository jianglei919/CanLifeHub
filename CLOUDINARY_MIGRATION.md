# Cloudinary 迁移指南

## 为什么需要 Cloudinary？
Render 使用临时文件系统，每次部署/重启会清空 `uploads/` 目录。Cloudinary 提供：
- ✅ 永久存储（25GB 免费）
- ✅ 全球 CDN 加速
- ✅ 自动图片优化
- ✅ 无需维护服务器

---

## 快速开始

### 1. 注册 Cloudinary
访问 https://cloudinary.com/users/register_free
- 免费计划：25GB 存储 + 25GB 月流量
- 获取凭证：Dashboard → Account Details
  - Cloud Name
  - API Key
  - API Secret

### 2. 安装依赖
```bash
cd API
npm install cloudinary multer-storage-cloudinary
```

### 3. 配置环境变量

**开发环境**（`API/.env.development`）：
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

**生产环境**（Render 控制台 → Web Service → Environment）：
- 添加同样的三个环境变量

### 4. 替换上传逻辑

#### 方案 A：完全替换（推荐）
```javascript
// API/routes/authRoutes.js
const { avatarUpload } = require('../helpers/cloudinaryUpload');

router.post('/upload-avatar',
  authMiddleware,
  avatarUpload.single('avatar'), // 使用 Cloudinary storage
  async (req, res) => {
    try {
      const avatarUrl = req.file.path; // Cloudinary 返回完整 URL
      // 更新数据库...
      res.json({ ok: true, url: avatarUrl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

#### 方案 B：兼容模式（开发用本地，生产用 Cloudinary）
```javascript
// API/helpers/upload.js
const isDev = process.env.NODE_ENV === 'development';
const storage = isDev 
  ? require('./localUpload')    // 本地 multer 配置
  : require('./cloudinaryUpload'); // Cloudinary 配置

module.exports = storage;
```

### 5. 修改路由

**头像上传**（`API/routes/authRoutes.js`）：
```javascript
const { avatarUpload } = require('../helpers/cloudinaryUpload');
router.post('/upload-avatar', authMiddleware, avatarUpload.single('avatar'), ...);
```

**帖子媒体**（`API/routes/postRoutes.js`）：
```javascript
const { postMediaUpload } = require('../helpers/cloudinaryUpload');
router.post('/', authMiddleware, postMediaUpload.array('media', 5), ...);
```

**聊天图片**（`API/routes/chatRoutes.js`）：
```javascript
const { chatImageUpload } = require('../helpers/cloudinaryUpload');
router.post('/upload-image', authMiddleware, chatImageUpload.single('image'), ...);
```

---

## 数据库字段说明

### ✅ 无需修改
Cloudinary 返回的 `req.file.path` 是完整 URL（如 `https://res.cloudinary.com/xxx/image/upload/v1234/canlifehub/avatars/avatar-xxx.jpg`），直接存入数据库即可。

前端已使用 `getMediaUrl()` 工具函数处理路径，兼容：
- 完整 URL（`http://` 或 `https://`）→ 直接使用
- 相对路径（`uploads/...`）→ 拼接 API 地址

---

## 迁移现有数据（可选）

如果需要迁移 `uploads/` 中的旧图片：

```javascript
// API/scripts/migrate-to-cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadsDir = path.join(__dirname, '../uploads');

async function migrateFolder(folderPath, cloudinaryFolder) {
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    if (fs.statSync(filePath).isFile()) {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: cloudinaryFolder,
          public_id: path.parse(file).name
        });
        console.log(`✓ ${file} → ${result.secure_url}`);
        // 更新数据库中的 URL...
      } catch (err) {
        console.error(`✗ ${file}:`, err.message);
      }
    }
  }
}

migrateFolder(path.join(uploadsDir, 'avatars'), 'canlifehub/avatars');
migrateFolder(path.join(uploadsDir, 'posts'), 'canlifehub/posts/images');
```

---

## 测试清单

- [ ] 本地开发环境配置 Cloudinary 凭证
- [ ] 注册新用户并上传头像 → 检查返回 URL 格式
- [ ] 发布帖子并上传图片 → 验证前端能正常显示
- [ ] 聊天发送图片 → 确认图片可访问
- [ ] Render 环境变量配置完成
- [ ] 部署到 Render 并测试上传功能

---

## 故障排查

**问题 1：`Cloudinary invalid signature`**
→ 检查 `CLOUDINARY_API_SECRET` 是否正确（复制时不要有空格）

**问题 2：上传后前端显示 404**
→ 确认数据库存储的是 `req.file.path`（完整 URL）而非 `req.file.filename`

**问题 3：上传速度慢**
→ Cloudinary 自动选择最近节点，首次上传可能较慢，CDN 缓存后会加速

**问题 4：超出免费额度**
→ 免费版：25GB 存储 + 25GB 月流量，足够中小型应用使用

---

## 回滚方案

如果迁移过程中出现问题，可快速回滚：

1. 恢复旧的 `upload.js`（注释掉 Cloudinary 配置）
2. 删除 Render 环境变量中的 `CLOUDINARY_*` 
3. 重新部署

---

## 进一步优化

### 1. 图片自动优化
```javascript
transformation: [
  { width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
]
```

### 2. 延迟加载缩略图
```javascript
// 生成缩略图 URL
const thumbnailUrl = cloudinary.url(publicId, {
  width: 200,
  height: 200,
  crop: 'thumb',
  gravity: 'face'
});
```

### 3. 删除旧文件
```javascript
// 用户更新头像时删除旧图片
const oldPublicId = extractPublicId(user.avatar); // 从 URL 提取 public_id
await cloudinary.uploader.destroy(oldPublicId);
```
