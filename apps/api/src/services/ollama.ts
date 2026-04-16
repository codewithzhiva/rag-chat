import { Ollama } from 'ollama'

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'
const CHAT_MODEL = process.env.OLLAMA_MODEL || 'llama3.1'
const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

const ollama = new Ollama({ host: HOST })

export async function checkOllama(): Promise<void> {
  await ollama.list()
}

export async function embed(text: string): Promise<number[]> {
  const res = await ollama.embeddings({ model: EMBED_MODEL, prompt: text })
  return res.embedding
}

export async function* streamChat(
  systemPrompt: string,
  userMessage: string,
): AsyncGenerator<string> {
  const stream = await ollama.chat({
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    stream: true,
  })

  for await (const chunk of stream) {
    if (chunk.message.content) {
      yield chunk.message.content
    }
  }
}

export function buildSystemPrompt(contextChunks: string[]): string {
  const context = contextChunks.join('\n\n---\n\n')
  return `You are a helpful assistant that answers questions based on the provided documents.
Use ONLY the information from the context below to answer questions.
If the answer is not in the context, say so clearly.
Be concise and accurate.

CONTEXT:
${context}`
}
