# CanLifeHub Render 部署完整指南

## 📋 目录
1. [前置准备](#前置准备)
2. [Render 账户配置](#render-账户配置)
3. [项目配置检查](#项目配置检查)
4. [部署步骤](#部署步骤)
5. [常见问题排查](#常见问题排查)
6. [部署后验证](#部署后验证)

---

## 前置准备

### 需要的账户和密钥
- ✅ Render 账户（连接 GitHub）
- ✅ MongoDB Atlas 连接字符串（`mongodb+srv://...`）
- ✅ Cloudinary 凭证（图片存储）
- ✅ Resend 邮件 API Key（邮件服务）
- ✅ Google Gemini API Key（AI 对话）
- ✅ JWT Secret（安全令牌）

### 本地验证
```bash
# 确保代码已提交到 GitHub
cd /Users/logcabin/Workspace/uwindsor/CanLifeHub
git status  # 应该显示 "On branch release-20251204" 且没有未提交更改
git push origin release-20251204  # 推送到 GitHub
```

---

## Render 账户配置

### 步骤 1：连接 GitHub
1. 访问 https://render.com
2. 登录或注册账户
3. 点击 **Dashboard** → **+ New** → **Web Service**
4. 选择 **GitHub** 并授权
5. 选择仓库 `jianglei919/CanLifeHub` 和分支 `release-20251204`

### 步骤 2：检查 Render 项目配置
Render 会根据 `render.yaml` 自动配置，**但需要手动验证**：

#### API 服务配置（Web Service）
- **名称**：`canlifehub-api`
- **构建命令**：`npm install`（自动进入 API 目录）
- **启动命令**：`npm run start`
- **端口**：8000
- **环境**：Node.js 20

#### UI 服务配置（Static Site）
- **名称**：`canlifehub-ui`
- **构建命令**：`npm install && npm run build`
- **发布目录**：`dist`
- **不需要**启动命令（Static Site 无需）

---

## 项目配置检查

### 检查清单

#### ✅ render.yaml（根目录）
```yaml
services:
  - type: web
    name: canlifehub-api
    env: node
    plan: free
    rootDir: API
    buildCommand: npm install
    startCommand: npm run start
    envVars:
      - key: NODE_VERSION
        value: "20"
      - key: MONGODB_URI        # ⭐ 必须使用 MONGODB_URI，不是 MONGODB_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: EMAIL_FROM
        value: "CanLifeHub <noreply@example.com>"
      - key: CORS_ORIGIN
        value: https://canlifehub-ui.onrender.com  # ⭐ 改成你的实际前端域名

  - type: static_site
    name: canlifehub-ui
    rootDir: UI
    buildCommand: npm install && npm run build
    publishPath: dist
    envVars:
      - key: VITE_API_BASE
        value: https://canlifehub.onrender.com  # ⭐ 改成你的实际 API 域名
        sync: false
```

#### ✅ API/package.json（启动脚本）
```json
{
  "scripts": {
    "dev": "NODE_ENV=development nodemon index.js",
    "start": "NODE_ENV=production node index.js"
  }
}
```

#### ✅ API/index.js（环境变量加载）
```javascript
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
require('dotenv').config({ path: path.join(__dirname, envFile) });
```
- ✅ 自动加载 `.env.production`（生产环境）
- ✅ 回退到 `.env.development`（本地开发）

#### ✅ API/.env.production（生产密钥）
```dotenv
MONGODB_URI=mongodb+srv://用户名:密码@cluster.xxx.mongodb.net/?appName=...
JWT_SECRET=你的强密码（至少32位）
RESEND_API_KEY=re_xxxxxxx
CLOUDINARY_CLOUD_NAME=你的
CLOUDINARY_API_KEY=你的
CLOUDINARY_API_SECRET=你的
GEMINI_API_KEY=你的
EMAIL_FROM=CanLifeHub <noreply@example.com>
CORS_ORIGIN=https://canlifehub-ui.onrender.com
NODE_ENV=production
PORT=8000
```

#### ✅ UI/package.json（构建脚本）
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```
- ⚠️ **不要有 "start" 脚本**（会干扰 Static Site 配置）

#### ✅ UI/vite.config.js（构建输出）
```javascript
export default {
  build: {
    outDir: 'dist',  // ✅ 必须输出到 dist
    sourcemap: false // ⭐ 生产环境禁用源映射（加快构建）
  }
}
```

#### ✅ UI/.env.production（生产 API 地址）
```dotenv
VITE_API_BASE=https://canlifehub.onrender.com
```

---

## 部署步骤

### 方法 A：自动部署（推荐）

1. **在本地提交并推送代码**
   ```bash
   cd /Users/logcabin/Workspace/uwindsor/CanLifeHub
   git add .
   git commit -m "配置 Render 部署"
   git push origin release-20251204
   ```

2. **在 Render 控制台设置环境变量**
   - 点击 **CanLifeHub-API** (Web Service)
   - 进入 **Environment** 标签
   - 添加所有必需的环境变量（见下表）
   - 点击 **Save**

3. **触发自动部署**
   - Render 检测到 GitHub push 会自动开始部署
   - 或手动点击 **Manual Deploy** → **Deploy latest commit**

4. **监控部署进度**
   - 点击 **Logs** 查看实时构建日志
   - 等待看到 `[API] listening on :8000` 表示成功

### 方法 B：手动部署（如果自动部署失败）

1. 在 Render 项目页面点击 **Manual Deploy**
2. 选择分支 `release-20251204`
3. 点击 **Deploy**
4. 等待完成（通常 2-5 分钟）

---

## 环境变量完整列表

在 Render 控制台 → **CanLifeHub-API** → **Environment** 中添加：

| KEY | VALUE | 说明 |
|-----|-------|------|
| `MONGODB_URI` | `<your mongodb+srv uri>` | MongoDB Atlas 连接 |
| `JWT_SECRET` | `<your 32+ char secret>` | 令牌加密密钥 |
| `RESEND_API_KEY` | `<your resend api key>` | 邮件服务 API Key |
| `CLOUDINARY_CLOUD_NAME` | `<your cloud name>` | 图片存储账户 |
| `CLOUDINARY_API_KEY` | `<your api key>` | 图片存储 Key |
| `CLOUDINARY_API_SECRET` | `<your api secret>` | 图片存储密钥 |
| `GEMINI_API_KEY` | `<your gemini api key>` | AI 对话 API Key |
| `EMAIL_FROM` | `CanLifeHub <noreply@example.com>` | 发件人邮箱 |
| `CORS_ORIGIN` | `https://canlifehub-ui.onrender.com` | 前端域名 |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `8000` | 服务端口 |
| `NODE_VERSION` | `20` | Node.js 版本 |

---

## 常见问题排查

### ❌ 问题 1：CORS 错误 `Access-Control-Allow-Origin` 不匹配

**原因**：`CORS_ORIGIN` 环境变量设置错误或未同步

**解决方案**：
1. 检查 Render 控制台 `CORS_ORIGIN` 值是否为 `https://canlifehub-ui.onrender.com`
2. 手动重启 API 服务：点击 **Manual Deploy** → **Deploy latest commit**
3. 等待 30 秒后刷新前端页面

### ❌ 问题 2：图片显示 404

**原因**：本地 `uploads` 文件夹在 Render 临时文件系统中丢失

**解决方案**：
- ✅ 确保 `.env.production` 中配置了 Cloudinary
- ✅ 验证 `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` 已设置
- ✅ 新上传的图片应该返回 Cloudinary URL（`https://res.cloudinary.com/...`）

### ❌ 问题 3：UI 部署失败 - "Publish directory does not exist"

**原因**：发布目录设置错误

**解决方案**：
1. 进入 UI Static Site 设置
2. 确保 **Publish directory** 设置为 `dist`（不是命令）
3. 确保 `vite.config.js` 中 `build.outDir: 'dist'`
4. 删除 UI 中的 "start" 脚本（会导致 Render 混淆）

### ❌ 问题 4：MongoDB 连接失败

**原因**：连接字符串错误或 IP 白名单未添加

**解决方案**：
1. 在 MongoDB Atlas 中确认连接字符串格式：`mongodb+srv://user:pwd@cluster.xxx.mongodb.net/?appName=...`
2. 在 MongoDB Atlas → **Network Access** 中添加 Render IP 范围：`0.0.0.0/0`
3. 重启 API 服务

### ❌ 问题 5：邮件发送失败

**原因**：Resend API Key 无效或邮件格式错误

**解决方案**：
1. 在 https://resend.com 获取有效的 API Key
2. 在 Render 环境变量中更新 `RESEND_API_KEY`
3. 检查 `.env.production` 中的 `EMAIL_FROM` 格式

---

## 部署后验证

### ✅ 步骤 1：检查 API 服务

访问 `https://canlifehub.onrender.com/healthz`，应该返回 `ok`

```bash
curl https://canlifehub.onrender.com/healthz
# 输出：ok
```

### ✅ 步骤 2：检查前端服务

访问 `https://canlifehub-ui.onrender.com`，应该显示登录页面

### ✅ 步骤 3：测试登录功能

1. 打开前端 URL
2. 点击 **Register** 创建账户
3. 检查邮件验证（Resend 邮件应该被收到）
4. 登录后检查是否有 CORS 错误（F12 → Console）

### ✅ 步骤 4：测试图片上传

1. 登录后进入 **Edit Profile**
2. 上传头像
3. 打开浏览器开发者工具（F12）
4. 检查响应中的图片 URL 是否为 `https://res.cloudinary.com/...`（Cloudinary）或 `https://canlifehub.onrender.com/uploads/...`（local，仅开发环境）

### ✅ 步骤 5：查看实时日志

在 Render 控制台点击 **Logs** 查看 API 服务日志：
```
[API] Mongo connected
[API] listening on :8000
```

---

## 🎉 部署成功标志

- ✅ 前端能访问：`https://canlifehub-ui.onrender.com`
- ✅ API 健康检查通过：`https://canlifehub.onrender.com/healthz` → `ok`
- ✅ 无 CORS 错误（F12 Console）
- ✅ 能登录和注册
- ✅ 图片能正常上传和显示
- ✅ 邮件能正常发送

---

## 快速重新部署

如果需要快速重新部署（修复 bug、更新代码）：

```bash
# 1. 本地修改并提交
git add .
git commit -m "修复 bug"
git push origin release-20251204

# 2. Render 会自动检测，或手动点击 Manual Deploy
# 通常需要 2-5 分钟部署完成

# 3. 查看日志确认成功
# 访问 https://canlifehub.onrender.com/healthz 验证
```

---

## 📞 技术支持

遇到问题？按以下顺序排查：

1. **检查环境变量**：Render 控制台 → Environment
2. **查看实时日志**：Render 控制台 → Logs
3. **检查浏览器控制台**：F12 → Console（CORS 错误）
4. **检查网络请求**：F12 → Network（API 响应）
5. **重启服务**：Manual Deploy → Deploy latest commit

---

**最后更新**：2025-12-04
**Render 文档**：https://render.com/docs
**本项目分支**：`release-20251204`
