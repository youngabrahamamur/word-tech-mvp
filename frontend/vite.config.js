import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'EnWords 英语单词',
        short_name: 'EnWords',
        description: 'AI 驱动的英语学习助手',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png', // 确保 public 文件夹里有这个图
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // 确保 public 文件夹里有这个图
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        // 关键设置：让它像 App 一样显示
        display: 'standalone', 
        background_color: '#ffffff',
        start_url: '/',
        orientation: 'portrait'
      }
    })
  ],
})
