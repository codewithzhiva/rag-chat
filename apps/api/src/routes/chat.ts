import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { buildSystemPrompt, embed, streamChat } from '../services/ollama.js'
import { searchChunks } from '../services/qdrant.js'

export const chatRoute = new Hono()

chatRoute.post('/stream', async (c) => {
  const { message } = await c.req.json<{ message: string }>()

  if (!message?.trim()) {
    return c.json({ error: 'Message is required' }, 400)
  }

  return streamSSE(c, async (stream) => {
    // 1. Embed user query
    const queryEmbedding = await embed(message)

    // 2. Retrieve relevant chunks from Qdrant
    const sources = await searchChunks(queryEmbedding, 5)

    if (sources.length === 0) {
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          content: 'No relevant documents found. Upload some documents first.',
        }),
      })
      return
    }

    // 3. Build system prompt with retrieved context
    const systemPrompt = buildSystemPrompt(sources.map((s) => s.text))

    // 4. Stream LLM response token by token
    for await (const token of streamChat(systemPrompt, message)) {
      await stream.writeSSE({
        data: JSON.stringify({ type: 'token', content: token }),
      })
    }

    // 5. Send source metadata so UI can show citations
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'sources',
        sources: sources.map(({ filename, chunkIndex, text }) => ({
          filename,
          chunkIndex,
          excerpt: text.slice(0, 200) + (text.length > 200 ? '…' : ''),
        })),
      }),
    })

    // 6. Signal completion
    await stream.writeSSE({ data: JSON.stringify({ type: 'done' }) })
  })
})
