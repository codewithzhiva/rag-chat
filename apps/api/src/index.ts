import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { chatRoute } from './routes/chat.js'
import { documentsRoute } from './routes/documents.js'
import { healthRoute } from './routes/health.js'
import { ensureCollection } from './services/qdrant.js'

const app = new Hono()

app.use('*', cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use('*', logger())

app.route('/health', healthRoute)
app.route('/documents', documentsRoute)
app.route('/chat', chatRoute)

const PORT = Number(process.env.PORT) || 3000

// Ensure Qdrant collection exists on startup
await ensureCollection()

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`)
})
