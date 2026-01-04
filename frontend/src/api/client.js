import axios from 'axios';

// 修改这里：优先读取环境变量，读不到才用本地地址
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: baseURL,
  timeout: 60000, // 稍微改大点，防止云端唤醒慢
});

// 请求拦截器：自动加上 User ID
client.interceptors.request.use((config) => {
  const userId = localStorage.getItem("clerk_user_id");
  if (userId) {
    // 把 User ID 放在 Header 里传给后端
    config.headers['x-user-id'] = userId;
  }
  return config;
});

// 响应拦截器：处理一下数据解包，方便后续使用
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default client;
