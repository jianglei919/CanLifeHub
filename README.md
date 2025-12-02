# CanLifeHub

Canadian Lifestyle Sharing Platform · 加拿大生活分享平台

## Project Structure / 项目结构

### `UI/` (Vite + React)
- `context/` — Auth & user context.（登录态与用户信息上下文）
  - `userContext.jsx` — Provide `user/loading/login/register/logout` via React Context.（暴露登录相关方法）
  - `LanguageContext.jsx` — Multi-language support.（多语言上下文）
- `src/` — Application source code.（前端源码）
  - `api/` — API layer & HTTP client.（接口封装与请求客户端）
    - `http.js` — Axios instance (`baseURL=/api`, `withCredentials=true`, error interceptor).（统一 axios 实例与错误拦截）
  - `assets/` — Static resources (images, icons, etc.).（静态资源）
  - `components/` — Reusable UI components.（可复用组件）
    - `Navbar`, `PostList`, `CreatePost`, `CommentsBox`, `ChatbotWidget`, `AdManager`...
  - `pages/` — Page components.（页面组件）
    - `Home`, `Login`, `Register`, `Dashboard`, `AdminDashboard`, `DetailPost`...
  - `styles/` — Global or modular styles.（样式文件）
  - `App.jsx` — App shell & routes definition.（应用骨架与路由定义）
  - `main.jsx` — React root mount.（React 挂载入口）
- `index.html` — Vite HTML template.（Vite 模板页）
- `vite.config.js` — Dev server & proxy config (`/api` → `http://localhost:5000`).（开发代理配置）
- `package.json` — Frontend dependencies & scripts.（前端依赖与脚本）
- `node_modules/` — Installed packages.（依赖目录）

---

### `API/` (Node.js + Express)
- `controllers/` — Business logic handlers.（业务控制器）
  - `authController.js`, `postController.js`, `feedController.js`, `chatController.js`, `adController.js`, `adminController.js`...
- `helpers/` — Utilities & helpers.（工具与辅助函数）
  - `auth.js`, `email.js`, `upload.js`...
- `models/` — Mongoose schemas.（数据模型）
  - `user.js`, `post.js`, `comment.js`, `message.js`, `advertisement.js`...
- `routes/` — Route definitions (relative paths only).（路由定义，仅写相对路径）
  - `authRoutes.js`, `postRoutes.js`, `chatRoutes.js`, `adRoutes.js`, `adminRoutes.js`...
- `app.js` — Express app assembly: CORS/cookie/json, health check, route mounting under `/api/*`, 404 & error handlers.（应用装配与中间件、统一前缀、错误处理）
- `index.js` — Entry point: load `.env`, connect MongoDB, `app.listen`, graceful shutdown.（启动入口：环境、连库、监听、优雅退出）
- `.env` — Environment variables (e.g., `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`).（环境变量）
- `package.json` — Backend dependencies & scripts.（后端依赖与脚本）
- `node_modules/` — Installed packages.（依赖目录）

---

## 社交与内容模块 / Social & Content Module

> 核心社区功能：支持用户发布图文、浏览信息流、互动评论与关注好友。

### 核心设计
- **帖子 (Post)**: 支持多图上传 (`uploadPostMedia.js`)，包含标题、内容、标签。
- **互动 (Interaction)**:
  - **评论 (Comment)**: 支持对帖子进行评论 (`commentController.js`)。
  - **点赞 (Reaction)**: 支持多种表情回应 (`reaction.js`)。
  - **关注 (Follow)**: 用户关注机制 (`followController.js`)，影响信息流推荐。
- **信息流 (Feed)**: `feedController.js` 聚合关注人的动态与推荐内容。
- **举报 (Report)**: 内容风控入口 (`reportController.js`)。

### 相关 API
| Method & Path | 说明 |
| --- | --- |
| `POST /api/posts` | 发布新帖子 (支持 `multipart/form-data`) |
| `GET /api/feed` | 获取首页信息流 |
| `POST /api/posts/:id/comments` | 评论帖子 |
| `POST /api/posts/:id/react` | 点赞/互动 |
| `POST /api/users/:id/follow` | 关注用户 |

---

## 即时通讯模块 / Messaging Module

> 实时沟通能力：集成私信聊天与 AI 助手。

### 核心设计
- **私信 (Direct Message)**: `chatController.js` 实现用户间的一对一聊天，支持发送图片。
- **AI 助手 (Chatbot)**: `chatbotController.js` 集成智能对话能力，解答平台相关问题。
- **前端组件**: `Messages.jsx` (聊天窗口), `ChatbotWidget.jsx` (悬浮助手)。

### 相关 API
| Method & Path | 说明 |
| --- | --- |
| `GET /api/chat/conversations` | 获取会话列表 |
| `GET /api/chat/:userId` | 获取与某人的聊天记录 |
| `POST /api/chat/:userId` | 发送私信 |
| `POST /api/chatbot/ask` | 向 AI 助手提问 |

---

## 广告投放模块 / Advertisement Module

> 新增于 2025-11：支持广告主在线提交投放需求、费用试算、管理员审核排期与收费记录，并在前台动态展示付费广告。

### 核心设计
- **数据模型**：`Advertisement` (MongoDB) 包含 `advertiser`, `creative`, `schedule`, `billing`, `audit`, `metrics` 等子文档，并以 `status`（`pending_review` → `approved`/`scheduled` → `running` → `completed`）串联全部流程。
- **计费规则**：在 `controllers/adController.js` 中维护 `PLACEMENT_PRICING` 表（侧边栏/信息流/开屏分别有 `dailyRate`、`reviewFee`、`estimatedDailyReach`）。报价计算公式：`baseCost = dailyRate * durationDays`，`tax = baseCost * 6%`，`totalDue = baseCost + reviewFee + tax`。
- **调度策略**：仅当 `billing.paymentStatus === 'paid'` 且当前时间位于 `schedule.startAt ~ endAt` 之间时，才会被列入 `GET /api/ads/active` 投放池。
- **审核/收费**：管理员通过 `PATCH /api/ads/:id/status|schedule|billing` 更新状态、排期与收费进度（需要 `User.role === 'admin'`）。
- **投放数据回传**：前端对曝光/点击分别调用 `POST /api/ads/:id/metrics` （无鉴权，但带节流逻辑）。

### 前后台体验
1. **广告主**（登录用户即可）
  - 在 `Dashboard` 右栏点击「我要投放」开启 `AdSubmissionModal`；
  - 填写投放档期、素材链接、定向等信息，提交后立即得到试算报价（含预计曝光量）；
  - 可在 `GET /api/ads?mine=true` 中查看自己的申请进度（待扩展 UI）。
2. **管理员**
  - 通过数据库把目标账号 `role` 字段设为 `admin`；
  - 登录 Dashboard 后将看到新的「📢 广告管理」tab，组件 `AdManager` 支持：
    - 筛选不同状态的广告，查看费用与排期；
    - 直接切换审核状态、收费状态；
    - 使用日期控件快速调整 `startAt/endAt` 并回写数据库；
    - 实时统计待审核、投放中的数量。
3. **访客/普通用户**
  - `Advertisement` 组件会自动轮播当前正在投放的广告，展示素材/CTA；
  - 无需登录即可看到广告，但要提交投放需求仍需登录（按钮会提示登录）。

### 相关 API
| Method & Path | 说明 |
| --- | --- |
| `POST /api/ads` | 提交广告投放申请（需登录） |
| `GET /api/ads` | 登录用户查看自己的投放；管理员查看全部（支持 `status`, `placement`） |
| `GET /api/ads/active` | 前台请求可投放广告（公开接口） |
| `PATCH /api/ads/:id/status` | 管理员审批/暂停/拒绝 |
| `PATCH /api/ads/:id/schedule` | 管理员调整排期并重新计价 |
| `PATCH /api/ads/:id/billing` | 管理员更新收费/发票状态 |
| `POST /api/ads/:id/metrics` | 前端回传曝光/点击 |

### 快速验证
1. 创建或选取一个用户，在 MongoDB 中把 `role` 字段改为 `admin`；
2. 启动 API (`cd API && npm run dev`) 与 UI (`cd UI && npm run dev`)；
3. 以普通账号登录，点击「我要投放」，填写表单后提交，可在控制台看到 `201` 响应与报价；
4. 切换为管理员账号，进入「广告管理」tab 审核、标记为已支付，并确认前台广告栏已经显示该素材；
5. 观察 `Advertisement` 组件发出的 `POST /api/ads/:id/metrics` 请求，验证统计写入成功。

---

## 后台管理中心 / Admin Console

> 新增 `/admin` 前端页面 + `/api/admin/*` 后端接口，实现统一的后台桌面，参考设计稿（暗色侧边栏 + 指标卡片）。仅 `role=admin` 用户可访问。

### 能力概览
- **仪表盘**：调用 `GET /api/admin/overview` 聚合用户数、帖子数、广告状态、试算日消耗，并展示最新用户/帖子/广告动态。
- **用户管理**：`GET /api/admin/users` 支持按名称/邮箱搜索、分页；`PATCH /api/admin/users/:id/role` 可切换普通用户/管理员。
- **帖子管理**：`GET /api/admin/posts` 查看全部帖子，按标题/状态筛选；`PATCH /api/admin/posts/:id/status` 可将帖子设为 `active/pending/hidden/deleted`，便于内容风控。
- **广告活动**：嵌入新的后台 AdManager 视图，复用广告审核、排期与收费流程，实现「投放、付费、看效果」的一站式体验。
- **数据报表**：预留报表模块容器，后续可接入 BI、举报或风控指标。

### 入口
- PC 浏览器访问 `http://localhost:5173/admin`（或部署后的域名）；未登录会跳转登录页，非管理员会回到首页。
- 用户面板右上角新增「后台」按钮，可随时返回后台；后台左下角提供「返回前台」按钮。

### 界面风格
- 侧边导航 + 主工作区的布局，深色渐变背景、玻璃态卡片，与示例图保持一致；色彩沿用前台的紫色渐变，保证品牌统一。
- 各模块（仪表盘、用户管理、帖子管理、广告活动、数据报表）均在同一页面内切换，避免分散体验。
