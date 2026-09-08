import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// En Docker el backend se alcanza por el nombre del servicio "backend".
// En local (fuera de Docker) se alcanza por localhost:4001.
const backendTarget = process.env.VITE_PROXY_TARGET || 'http://backend:4001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5180,
    host: '0.0.0.0',   // necesario para exponer dentro de Docker
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      }
    }
  }
})
