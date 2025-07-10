import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6969,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['@google/generative-ai'],
          ocr: ['tesseract.js']
        }
      }
    }
  },
  // Base path for Cloudflare Pages
  base: '/',
  // Optimize for Cloudflare Pages
  optimizeDeps: {
    include: ['react', 'react-dom', '@google/generative-ai', 'tesseract.js']
  }
})
