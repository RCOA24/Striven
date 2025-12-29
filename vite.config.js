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
      // RapidAPI ExerciseDB Image Service - separate endpoint for GIFs
      '/api/exercisedb-image': {
        target: 'https://exercisedb.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exercisedb-image/, '/image'),
        secure: true,
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      // RapidAPI ExerciseDB Exercise Service
      '/api/exercises': {
        target: 'https://exercisedb.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exercises/, '/exercises'),
        secure: true,
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48',
        },
      },
    }
  }
})