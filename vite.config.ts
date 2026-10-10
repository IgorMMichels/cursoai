import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { getRegionalCatalog } from './src/lib/regional-offers.ts'

export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, process.cwd(), '')
  const serverEnvironment = { ...process.env, ...localEnv }
  return {
    plugins: [react(), tailwindcss(), {
      name: 'local-regional-offers-api',
      configureServer(server) {
        server.middlewares.use('/api/regional-offers', (request, response) => {
          response.setHeader('Cache-Control', 'private, no-store, max-age=0')
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          if (request.method !== 'GET') {
            response.statusCode = 405
            response.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }
          const country = serverEnvironment.OMEGA_DEV_COUNTRY?.toUpperCase() ?? null
          response.end(JSON.stringify(getRegionalCatalog(country)))
        })
      },
    }],
    server: {
      proxy: {
        '/bots-api': {
          target: 'http://127.0.0.1:8787',
          rewrite: (url) => url.replace(/^\/bots-api/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
      },
    },
  }
})
