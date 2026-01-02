import axios from 'axios';

const client = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // 你的 FastAPI 地址
  timeout: 5000,
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
