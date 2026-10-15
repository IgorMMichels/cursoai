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
          // Local dev has no CDN country header; default to Brazil so prices render.
          const country = (serverEnvironment.OMEGA_DEV_COUNTRY || 'BR').toUpperCase()
          response.end(JSON.stringify(getRegionalCatalog(country)))
        })
      },
    },
    {
      name: 'local-checkout-api',
      // Vercel serves /api in production; mirror the billing and crypto functions for `vite dev`.
      configureServer(server) {
        for (const [route, file] of [['/api/checkout/create-session', '/api/checkout/create-session.ts'], ['/api/stripe/webhook', '/api/stripe/webhook.ts'], ['/api/crypto/create-order', '/api/crypto/create-order.ts'], ['/api/crypto/confirm', '/api/crypto/confirm.ts'], ['/api/crypto/rpc', '/api/crypto/rpc.ts'], ['/api/crypto/reconcile', '/api/crypto/reconcile.ts'], ['/api/pix/create-order', '/api/pix/create-order.ts'], ['/api/asaas/webhook', '/api/asaas/webhook.ts'], ['/api/course-media/sign', '/api/course-media/sign.ts']] as const) {
          server.middlewares.use(route, async (request, response) => {
            for (const [key, value] of Object.entries(localEnv)) if (process.env[key] === undefined) process.env[key] = value
            // No CDN country header locally; match the Brazil default used by /api/regional-offers so the server prices what the page shows.
            process.env.OMEGA_DEV_COUNTRY ||= 'BR'
            // Return to the dev server after paying instead of the production domain.
            const host = request.headers.host ?? ''
            if (/^localhost(:\d+)?$/.test(host)) process.env.SITE_URL = `http://${host}`
            try {
              const module = await server.ssrLoadModule(file) as { default: (request: unknown, response: unknown) => Promise<void> | void }
              await module.default(request, response)
            } catch (error) {
              console.error('[local-checkout-api]', error)
              response.statusCode = 500
              response.setHeader('Content-Type', 'application/json; charset=utf-8')
              response.end(JSON.stringify({ error: 'Local API failed to load.' }))
            }
          })
        }
      },
    },
    ],
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
