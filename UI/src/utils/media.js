// UI/src/utils/media.js
/**
 * 工具函数：将后端返回的相对路径转换为完整 URL
 * 例如：uploads/avatars/avatar-xxx.jpg -> http://localhost:8000/uploads/avatars/avatar-xxx.jpg
 */

// 获取 API 基础地址（不带 /api 后缀）
const getApiBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE || '/api';
  // 移除 /api 后缀，获取服务器基础地址
  return apiBase.replace(/\/api$/, '');
};

/**
 * 将相对路径转换为完整的 URL
 * @param {string} url - 后端返回的图片/视频路径
 * @returns {string} - 完整的 URL
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  
  // 如果已经是完整 URL（http/https）或 base64 数据，直接返回
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  
  // 如果是相对路径，拼接 API 基础地址
  const baseUrl = getApiBaseUrl();
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};
