// UI/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,  // 生产环境禁用源映射
  },
  server: {
    port: 5173,
    proxy: {
      // 关键：把 /api 反向代理到后端
      '/api': {
        target: 'http://localhost:8000',  // 本地开发环境
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})