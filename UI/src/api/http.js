// UI/src/api/http.js
// 统一的 Axios 实例 + 常用 API 封装
// 适配后端：Cookie 持久化登录、错误返回形如 { error: '...' }

import axios from 'axios';

// dev 环境建议在 vite.config.js 里把 /api 代理到 http://localhost:5000
// prod 可在 .env.production 中配置 VITE_API_BASE 为你的线上网关
const baseURL = import.meta.env.VITE_API_BASE || '/api';

const http = axios.create({
  baseURL,
  withCredentials: true, // 必须：后端把 JWT 写在 HttpOnly Cookie 里
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 统一响应拦截：你的后端把错误放在 data.error，且多为 200 状态
http.interceptors.response.use(
  (resp) => {
    const data = resp?.data;
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      const err = new Error(data.error);
      err.response = resp;
      throw err;
    }
    return resp;
  },
  (error) => Promise.reject(error)
);

// 常用 API：与 app.js 中 app.use('/api/auth', authRoutes) 对齐
export const authApi = {
  test: () => http.get('/auth/'),                 // GET /api/auth/
  register: (payload) => http.post('/auth/register', payload),
  login: (payload) => http.post('/auth/login', payload),
  profile: () => http.get('/auth/profile'),
  // logout: () => http.post('/auth/logout'),     // 后端未实现，若需要请在 API 端补一条路由
};
//todo: 新增 API 放在这里！！！！

// 便捷函数：直接返回 data
export async function $get(url, config) {
  const res = await http.get(url, config);
  return res.data;
}

export async function $post(url, body, config) {
  const res = await http.post(url, body, config);
  return res.data;
}

export default http;