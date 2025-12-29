// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['@capacitor/camera'],
      output: {
        globals: {
          '@capacitor/camera': 'CapacitorCamera'
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/hf': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hf/, ''),
      },
      // ExerciseDB API proxy for local development
      // Proxies /api/v1/* to https://exercisedb-api.vercel.app/api/v1/*
      '/api': {
        target: 'https://exercisedb-api.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url, '→', options.target + req.url);
          });
        }
      },
    }
  }
})