import axios from 'axios';

// 修改这里：优先读取环境变量，读不到才用本地地址
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: baseURL,
  timeout: 60000, // 稍微改大点，防止云端唤醒慢
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
