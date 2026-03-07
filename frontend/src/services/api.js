import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3457/api';

// 创建 Axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加 X-API-Key Header
// 使用 sessionStorage 替代 localStorage 提高安全性
api.interceptors.request.use(
  (config) => {
    const apiKey = sessionStorage.getItem('apiKey');
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.error?.message || error.message || '请求失败';
    const errorCode = error.response?.data?.error?.code || 'UNKNOWN_ERROR';

    // 处理常见错误
    if (error.response?.status === 401) {
      sessionStorage.removeItem('apiKey');
      sessionStorage.removeItem('user-storage');
      window.location.href = '/login';
    }

    return Promise.reject({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
);

export default api;