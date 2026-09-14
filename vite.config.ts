import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const base = new URL(env.AI_BASE_URL || 'https://api.openai.com/v1/')
  const proxy: Record<string, ProxyOptions> = {
    '/api/ai': {
      target: base.origin,
      changeOrigin: true,
      rewrite: (path: string) => `${base.pathname.replace(/\/$/, '')}${path.replace(/^\/api\/ai/, '')}`,
      headers: { Authorization: `Bearer ${env.AI_API_KEY || ''}` },
    },
  }
  return {
    plugins: [react()],
    server: { host: '127.0.0.1', proxy },
    preview: { host: '127.0.0.1', proxy },
  }
})
