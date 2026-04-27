import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { runAgenticRag } from '../services/agentic-rag.js'

export const chatRoute = new Hono()

chatRoute.post('/stream', async (c) => {
  const { message } = await c.req.json<{ message: string }>()

  if (!message?.trim()) {
    return c.json({ error: 'Message is required' }, 400)
  }

  return streamSSE(c, async (stream) => {
    try {
      // Signal that retrieval is starting
      await stream.writeSSE({
        data: JSON.stringify({ type: 'status', content: 'Retrieving relevant documents…' }),
      })

      const { answer, relevantChunks, loopCount } = await runAgenticRag(message)

      if (relevantChunks.length === 0) {
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            content: 'No relevant documents found. Upload some documents first.',
          }),
        })
        return
      }

      // Emit retrieval metadata so UI can show how many loops were needed
      if (loopCount > 1) {
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'status',
            content: `Retrieved after ${loopCount} retrieval ${loopCount === 1 ? 'pass' : 'passes'}`,
          }),
        })
      }

      // Stream answer token by token (split on spaces for basic streaming effect)
      const words = answer.split(' ')
      for (let i = 0; i < words.length; i++) {
        const token = (i === 0 ? '' : ' ') + words[i]
        await stream.writeSSE({ data: JSON.stringify({ type: 'token', content: token }) })
      }

      // Send source citations
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'sources',
          sources: relevantChunks.map(({ filename, chunkIndex, text }) => ({
            filename,
            chunkIndex,
            excerpt: text.slice(0, 200) + (text.length > 200 ? '…' : ''),
          })),
          loopCount,
        }),
      })

      await stream.writeSSE({ data: JSON.stringify({ type: 'done' }) })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', content: message }) })
    }
  })
})
