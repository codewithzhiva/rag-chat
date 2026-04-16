import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'
import { chunkText } from '../lib/chunker.js'
import { embed } from '../services/ollama.js'
import {
  deleteDocument,
  listDocuments,
  upsertChunks,
} from '../services/qdrant.js'

export const documentsRoute = new Hono()

documentsRoute.get('/', async (c) => {
  const docs = await listDocuments()
  return c.json({ documents: docs })
})

documentsRoute.post('/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  const supportedTypes = ['text/plain', 'text/markdown', 'application/pdf']
  if (!supportedTypes.includes(file.type) && !file.name.match(/\.(txt|md|pdf)$/i)) {
    return c.json({ error: 'Unsupported file type. Use PDF, TXT, or MD.' }, 400)
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE) {
    return c.json({ error: 'File too large. Max 10MB.' }, 400)
  }

  let text: string

  if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer()
    const { default: pdfParse } = await import('pdf-parse')
    const parsed = await pdfParse(Buffer.from(buffer))
    text = parsed.text
  } else {
    text = await file.text()
  }

  if (!text.trim()) {
    return c.json({ error: 'File appears to be empty or unreadable.' }, 400)
  }

  const docId = uuidv4()
  const rawChunks = chunkText(text)

  // Embed all chunks (sequential to avoid overwhelming Ollama)
  const chunks: { text: string; embedding: number[] }[] = []
  for (const chunk of rawChunks) {
    const embedding = await embed(chunk)
    chunks.push({ text: chunk, embedding })
  }

  await upsertChunks(chunks, docId, file.name)

  return c.json({
    docId,
    filename: file.name,
    chunkCount: chunks.length,
    message: 'Document indexed successfully',
  })
})

documentsRoute.delete('/:docId', async (c) => {
  const { docId } = c.req.param()
  await deleteDocument(docId)
  return c.json({ message: 'Document deleted', docId })
})
