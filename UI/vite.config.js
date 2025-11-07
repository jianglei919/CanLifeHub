// UI/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 关键：把 /api 反向代理到后端
      '/api': {
        target: 'http://localhost:8000',  // API 端口按你的 .env 为准
        changeOrigin: true,
        secure: false,
        // 若后端没有 /api 前缀才需要 rewrite，这里不需要
        // rewrite: p => p.replace(/^\/api/, '')
      }
    }
  }
})