import { Hono } from 'hono'
import { checkOllama } from '../services/ollama.js'
import { checkQdrant } from '../services/qdrant.js'

export const healthRoute = new Hono()

healthRoute.get('/', async (c) => {
  const [ollama, qdrant] = await Promise.allSettled([checkOllama(), checkQdrant()])

  const status = {
    ollama: ollama.status === 'fulfilled' ? 'ok' : 'down',
    qdrant: qdrant.status === 'fulfilled' ? 'ok' : 'down',
    timestamp: new Date().toISOString(),
  }

  const allOk = status.ollama === 'ok' && status.qdrant === 'ok'
  return c.json(status, allOk ? 200 : 503)
})
