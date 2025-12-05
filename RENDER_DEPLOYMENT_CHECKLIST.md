# Render 部署快速检查清单

## 📝 部署前检查（复制粘贴使用）

### 1️⃣ 代码提交
```bash
cd /Users/logcabin/Workspace/uwindsor/CanLifeHub
git status                           # 检查是否有未提交的更改
git add .
git commit -m "Render 部署配置更新"
git push origin release-20251204     # 推送到 GitHub
```

### 2️⃣ 文件完整性检查
```bash
# 检查所有必要的配置文件是否存在
ls -la render.yaml                   # ✅ 根目录
ls -la .env.example                  # ✅ 根目录
ls -la API/package.json              # ✅ API 启动配置
ls -la API/.env.production           # ✅ API 生产密钥
ls -la UI/package.json               # ✅ UI 构建配置
ls -la UI/.env.production            # ✅ UI 生产配置
ls -la UI/vite.config.js             # ✅ UI Vite 构建配置
```

### 3️⃣ 环境变量值检查
```bash
# 检查 API/.env.production
cat API/.env.production | grep -E "MONGODB_URI|JWT_SECRET|CORS_ORIGIN"

# 检查 UI/.env.production
cat UI/.env.production
```

✅ **应该看到**：
- `MONGODB_URI=mongodb+srv://...`（MongoDB Atlas）
- `CORS_ORIGIN=https://canlifehub-ui.onrender.com`
- `VITE_API_BASE=https://canlifehub.onrender.com`

### 4️⃣ package.json 启动脚本检查
```bash
# 检查 API 启动脚本
cat API/package.json | grep -A 3 '"scripts"'

# 检查 UI 是否有 "start" 脚本（不应该有）
cat UI/package.json | grep '"start"'  # 应该没有任何输出
```

✅ **应该看到**：
- API 有 `"start": "NODE_ENV=production node index.js"`
- UI 无 `"start"` 脚本

---

## 🚀 Render 控制台设置（5 分钟）

### 步骤 1：连接 GitHub（如果未连接）
1. 访问 https://render.com/dashboard
2. 点击 **+ New** → **Web Service**
3. 选择 **GitHub** 并授权
4. 选择仓库 `jianglei919/CanLifeHub`
5. 选择分支 `release-20251204`

### 步骤 2：验证 API 配置（Web Service）
1. 点击 **CanLifeHub-API**
2. 进入 **Settings** 标签，验证：
   - **Name**: `canlifehub-api`
   - **Environment**: `Node`
   - **Region**: `Singapore (preferred)` 或离用户近的地区
   - **Plan**: `Free`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Root Directory**: `API`

### 步骤 3：设置 API 环境变量
1. 点击 **CanLifeHub-API** → **Environment** 标签
2. 复制粘贴以下环境变量（从 API/.env.production 中获取真实值）：

| KEY | VALUE |
|-----|-------|
| `MONGODB_URI` | `<your mongodb+srv uri>` |
| `JWT_SECRET` | `<your 32+ char secret>` |
| `RESEND_API_KEY` | `<your resend api key>` |
| `CLOUDINARY_CLOUD_NAME` | `<your cloud name>` |
| `CLOUDINARY_API_KEY` | `<your api key>` |
| `CLOUDINARY_API_SECRET` | `<your api secret>` |
| `GEMINI_API_KEY` | `<your gemini api key>` |
| `EMAIL_FROM` | `CanLifeHub <noreply@example.com>` |
| `CORS_ORIGIN` | `https://canlifehub-ui.onrender.com` |
| `NODE_ENV` | `production` |
| `PORT` | `8000` |
| `NODE_VERSION` | `20` |

3. 点击 **Save** 并等待重启（通常 30 秒）

### 步骤 4：验证 UI 配置（Static Site）
1. 点击 **CanLifeHub-UI**
2. 进入 **Settings** 标签，验证：
   - **Name**: `canlifehub-ui`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`（⭐ 关键）
   - **Root Directory**: `UI`

✅ **重要**：Publish Directory 必须是 `dist`，不是命令

### 步骤 5：设置 UI 环境变量
1. 点击 **CanLifeHub-UI** → **Environment** 标签
2. 添加：

| KEY | VALUE |
|-----|-------|
| `VITE_API_BASE` | `https://canlifehub-api.onrender.com/api` |

3. 点击 **Save**

---

## ✅ 部署验证（3 分钟）

### 检查 1：健康检查
```bash
# 打开终端，运行：
curl https://canlifehub.onrender.com/healthz

# 应该看到：ok
```

### 检查 2：前端访问
1. 打开浏览器访问 `https://canlifehub-ui.onrender.com`
2. 应该看到登录页面
3. 按 F12 打开开发者工具 → Console
4. **不应该看到任何红色错误**（尤其是 CORS 错误）

### 检查 3：登录测试
1. 点击 **Register**
2. 填写邮箱、用户名、密码
3. 点击 **Sign Up**
4. 检查邮件收到验证链接
5. 验证后登录
6. 上传头像测试图片存储

### 检查 4：查看实时日志
1. 在 Render 控制台点击 **CanLifeHub-API** → **Logs**
2. 应该看到：
   ```
   [API] Mongo connected
   [API] listening on :8000
   ```

---

## ❌ 快速故障排查

### 问题：CORS 错误
```
Access-Control-Allow-Origin: http://localhost:5173 (不匹配 https://canlifehub-ui.onrender.com)
```
**解决**：
1. 检查 API 环境变量 `CORS_ORIGIN` 值
2. 点击 **Manual Deploy** 重启 API 服务
3. 等待 30 秒后刷新前端

### 问题：图片 404
**解决**：
1. 确保 `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` 已设置
2. 上传新图片后检查浏览器 Network 标签
3. 图片 URL 应该是 `https://res.cloudinary.com/...`

### 问题：UI 构建失败
**解决**：
1. 检查 **Publish Directory** 是否为 `dist`
2. 确保 UI/vite.config.js 有 `build: { outDir: 'dist' }`
3. 检查 UI/package.json 无 "start" 脚本
4. 点击 **Manual Deploy** 重新构建

### 问题：MongoDB 连接失败
**解决**：
1. 检查 `MONGODB_URI` 格式（应该是 `mongodb+srv://...`）
2. 在 MongoDB Atlas → **Network Access** 中允许 `0.0.0.0/0`
3. 重启 API 服务

---

## 🔄 快速重新部署

如果只是修改代码不改配置：

```bash
# 1. 提交代码
git add .
git commit -m "修复 bug"
git push origin release-20251204

# 2. Render 自动检测（或手动 Manual Deploy）
# 3. 等待 2-5 分钟
# 4. 访问 https://canlifehub.onrender.com/healthz 验证
```

---

## 📞 常用 Render URL

- **API 服务**：https://canlifehub.onrender.com
- **前端服务**：https://canlifehub-ui.onrender.com
- **健康检查**：https://canlifehub.onrender.com/healthz
- **API 日志**：Render 控制台 → CanLifeHub-API → Logs
- **UI 日志**：Render 控制台 → CanLifeHub-UI → Logs

---

**最后更新**：2025-12-04
