# Render Deploy Guide

## 运行命令约定
- API：`npm run dev`（开发，nodemon，`NODE_ENV=development`），`npm run start`（生产，`NODE_ENV=production`）。
- UI：`npm run dev`（开发模式），`npm run start`（生产预览，`vite preview --host --port 4173`，需要先 `npm run build`）。

## 环境变量清单
在 Render 控制台为对应服务设置，敏感信息不要提交到仓库：
- API（Web Service）：`MONGODB_URL`、`JWT_SECRET`、`RESEND_API_KEY`、`EMAIL_FROM`、`CORS_ORIGIN`、可选 `PORT`（默认为 8000）。
- UI（Static Site）：`VITE_API_BASE`（例：`https://<your-api>.onrender.com/api`）。

## 使用 render.yaml（推荐）
仓库根目录提供 `render.yaml`。在 Render 选择 **Blueprint** 部署，连接 GitHub 仓库并选择分支 `main`。
- API 服务：`type: web`，`env: node`，`rootDir: API`，`buildCommand: npm install`，`startCommand: npm run start`。
- UI 服务：`type: static_site`，`rootDir: UI`，`buildCommand: npm install && npm run build`，`publishPath: dist`。
- `envVars` 中带 `sync: false` 的变量需要你在 Render 控制台手动填写真实值。

## 手动创建服务（不使用 blueprint 时）
1) Web Service（API）
- Root Directory: `API`
- Build Command: `npm install`
- Start Command: `npm run start`
- Environment: `Node`（Node 20），设置上面列出的 API 环境变量。

2) Static Site（UI）
- Root Directory: `UI`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables: `VITE_API_BASE` 指向已部署 API 的 `/api` 路径。

## 部署后检查
- 在 Render Logs 中确认 API 成功连接 Mongo 并监听端口。
- 用浏览器访问前端站点，验证登录/注册等核心流程，关注跨域是否正常（`CORS_ORIGIN` 与前端域名一致）。
- 确认 `VITE_API_BASE` 与 API 域名匹配，前端网络请求无 4xx/5xx。

## ⚠️ 文件存储重要说明

### 问题
`uploads/` 目录在 Render 的**临时文件系统**中，每次重新部署、重启或扩容时都会被清空，导致用户上传的图片丢失。

### 解决方案（推荐顺序）

#### 1. **Cloudinary**（推荐，免费额度充足）
- 免费额度：25GB 存储 + 25GB 月流量
- 自动图片优化、CDN 加速、变换（裁剪/缩放）
- 安装：`npm install cloudinary multer-storage-cloudinary`
- 配置环境变量：`CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET`

#### 2. **AWS S3**（适合大规模）
- 按使用付费，前 12 个月有免费额度（5GB 存储 + 20,000 GET 请求）
- 需配置 IAM 凭证和 Bucket 策略
- 安装：`npm install @aws-sdk/client-s3 multer-s3`

#### 3. **Backblaze B2**（成本最低）
- 前 10GB 存储免费，每天 1GB 免费下载
- 兼容 S3 API
- 性价比高但 CDN 需额外配置

#### 4. **Render Persistent Disk**（临时方案，不推荐生产）
- 付费功能，需挂载持久卷
- 无法自动扩展，不支持多实例
- 仅适合低流量测试环境

### 快速实现（Cloudinary 示例）

**API 端修改**：
```javascript
// API/helpers/upload.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'canlifehub/avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

module.exports = multer({ storage });
```

**环境变量**（Render 控制台添加）：
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 迁移建议
1. 先在开发环境测试对象存储配置
2. 数据库中 `avatar`/`media.url` 字段已存完整 URL，无需改动前端
3. 部署前将现有 `uploads/` 内容手动上传到对象存储（可选）
