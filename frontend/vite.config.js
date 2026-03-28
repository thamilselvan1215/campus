import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/complaints': 'http://localhost:8000',
      '/staff': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    }
  }
})
