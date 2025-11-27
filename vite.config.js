import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This matches any request starting with /api/hf
      '/api/hf': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true, // This is the key: it tricks HF into thinking we are not localhost
        rewrite: (path) => path.replace(/^\/api\/hf/, ''),
        secure: false,
      },
    },
  },
})