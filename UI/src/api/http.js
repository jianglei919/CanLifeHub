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

// 统一响应拦截：处理后端错误信息
http.interceptors.response.use(
  (resp) => {
    // 处理200状态码但是包含error字段的情况
    const data = resp?.data;
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      const err = new Error(data.error);
      err.response = resp;
      throw err;
    }
    return resp;
  },
  (error) => {
    // 处理非200状态码的错误（如403、404、500等）
    if (error.response && error.response.data) {
      // 如果后端返回了错误信息，使用后端的错误信息
      if (error.response.data.error) {
        error.message = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        error.message = error.response.data;
      }
    }
    return Promise.reject(error);
  }
);

// 常用 API：与 app.js 中 app.use('/api/auth', authRoutes) 对齐
export const authApi = {
  test: () => http.get('/auth/'),                 // GET /api/auth/
  register: (payload) => http.post('/auth/register', payload),
  login: (payload) => http.post('/auth/login', payload),
  profile: () => http.get('/auth/profile'),
  verify: (payload) => http.post('/auth/verify', payload),
  resendVerification: (payload) => http.post('/auth/resend-verification', payload),
  forgotPassword: (payload) => http.post('/auth/forgot-password', payload),
  resetPassword: (payload) => http.post('/auth/reset-password', payload),
  logout: () => http.post('/auth/logout'),
  // logout: () => http.post('/auth/logout'),     // 后端未实现，若需要请在 API 端补一条路由
};

// 聊天 API
export const chatApi = {
  // 获取会话列表
  getConversations: () => http.get('/chat/conversations'),

  // 获取或创建与特定用户的会话
  getOrCreateConversation: (otherUserId) => http.get(`/chat/conversations/${otherUserId}`),

  // 获取会话中的消息
  getMessages: (conversationId, params) => http.get(`/chat/conversations/${conversationId}/messages`, { params }),

  // 发送消息
  sendMessage: (conversationId, payload) => http.post(`/chat/conversations/${conversationId}/messages`, payload),

  // 标记消息为已读
  markAsRead: (conversationId) => http.put(`/chat/conversations/${conversationId}/read`),

  // 拉黑/取消拉黑
  toggleBlock: (conversationId) => http.put(`/chat/conversations/${conversationId}/block`),

  // 搜索用户
  searchUsers: (query) => http.get('/chat/users/search', { params: { query } }),

  // 上传图片
  uploadImage: (formData) => http.post('/chat/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // 轮询获取新消息
  getNewMessages: (conversationId, since) => http.get(`/chat/conversations/${conversationId}/new-messages`, {
    params: { since }
  }),

  // 轮询获取已读状态更新
  getReadStatusUpdates: (conversationId, messageIds) => http.get(`/chat/conversations/${conversationId}/read-status`, {
    params: { messageIds: messageIds.join(',') }
  }),

  // 轮询获取会话列表更新
  getConversationsUpdate: (since) => http.get('/chat/conversations-update', {
    params: { since }
  })
};

// 评论 API（与 /api/comments 对齐）
export const commentsApi = {
  // 获取某目标的顶级评论列表
  // params: { targetType: 'post'|'comment', targetId, page?, pageSize?, sort? }
  listByTarget: (params) => http.get('/comments', { params }),

  // 获取某条评论的回复
  // params: { page?, pageSize? }
  listReplies: (commentId, params) => http.get(`/comments/${commentId}/replies`, { params }),

  // 创建评论或回复
  // payload: { targetType, targetId, parentId?, content, images? }
  create: (payload) => http.post('/comments', payload),

  // 编辑评论
  update: (commentId, payload) => http.patch(`/comments/${commentId}`, payload),

  // 删除评论（软删）
  remove: (commentId) => http.delete(`/comments/${commentId}`),
};

// AI Chatbot API
export const chatbotApi = {
  // 发送消息给 AI
  sendMessage: (payload) => http.post('/chatbot/chat', payload),
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