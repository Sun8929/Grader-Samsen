import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env variables from current directory
  const env = loadEnv(mode, process.cwd(), '')
  const frontendPort = parseInt(env.FRONTEND_PORT || env.PORT || '5173', 10)
  const backendPort = env.BACKEND_PORT || '3001'
  const backendUrl = env.VITE_API_URL || `http://localhost:${backendPort}`

  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/grader-samsen/' : '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
  }
})
