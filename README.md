# CanLifeHub

Canadian Lifestyle Sharing Platform · 加拿大生活分享平台

## Project Structure / 项目结构

### `UI/` (Vite + React)
- `context/` — Auth & user context.（登录态与用户信息上下文）
  - `userContext.jsx` — Provide `user/loading/login/register/logout` via React Context.（暴露登录相关方法）
- `src/` — Application source code.（前端源码）
  - `api/` — API layer & HTTP client.（接口封装与请求客户端）
    - `http.js` — Axios instance (`baseURL=/api`, `withCredentials=true`, error interceptor).（统一 axios 实例与错误拦截）
  - `assets/` — Static resources (images, icons, etc.).（静态资源）
  - `components/` — Reusable UI components (e.g., `Navbar`, `ProtectedRoute`).（可复用组件）
  - `pages/` — Page components (e.g., `Home`, `Login`, `Register`, `Dashboard`).（页面组件）
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
  - `authController.js` — Auth endpoints: register/login/profile/test.（注册/登录/个人信息/测试）
- `helpers/` — Utilities & helpers.（工具与辅助函数）
  - `auth.js` — Password hashing & comparison.（密码哈希与校验）
- `models/` — Mongoose schemas.（数据模型）
  - `user.js` — User schema.（用户模型）
- `routes/` — Route definitions (relative paths only).（路由定义，仅写相对路径）
  - `authRoutes.js` — `/register`, `/login`, `/profile`, `/`(test).（认证相关路由）
- `app.js` — Express app assembly: CORS/cookie/json, health check, route mounting under `/api/*`, 404 & error handlers.（应用装配与中间件、统一前缀、错误处理）
- `index.js` — Entry point: load `.env`, connect MongoDB, `app.listen`, graceful shutdown.（启动入口：环境、连库、监听、优雅退出）
- `.env` — Environment variables (e.g., `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`).（环境变量）
- `package.json` — Backend dependencies & scripts.（后端依赖与脚本）
- `node_modules/` — Installed packages.（依赖目录）
