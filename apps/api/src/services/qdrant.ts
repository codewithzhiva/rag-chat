import { QdrantClient } from '@qdrant/js-client-rest'
import { v4 as uuidv4 } from 'uuid'

const COLLECTION = 'rag_documents'
const VECTOR_SIZE = 768 // nomic-embed-text output dim

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
})

export async function checkQdrant(): Promise<void> {
  await client.getCollections()
}

export async function ensureCollection(): Promise<void> {
  const { collections } = await client.getCollections()
  const exists = collections.some((c) => c.name === COLLECTION)

  if (!exists) {
    await client.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    })
    console.log(`Created Qdrant collection: ${COLLECTION}`)
  }
}

export interface ChunkPayload {
  docId: string
  filename: string
  chunkIndex: number
  text: string
}

export async function upsertChunks(
  chunks: { text: string; embedding: number[] }[],
  docId: string,
  filename: string,
): Promise<void> {
  const points = chunks.map(({ text, embedding }, i) => ({
    id: uuidv4(),
    vector: embedding,
    payload: { docId, filename, chunkIndex: i, text } as ChunkPayload,
  }))

  await client.upsert(COLLECTION, { points, wait: true })
}

export async function searchChunks(
  queryEmbedding: number[],
  topK = 5,
): Promise<ChunkPayload[]> {
  const results = await client.search(COLLECTION, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true,
    score_threshold: 0.4,
  })

  return results.map((r) => r.payload as ChunkPayload)
}

export async function deleteDocument(docId: string): Promise<void> {
  await client.delete(COLLECTION, {
    filter: {
      must: [{ key: 'docId', match: { value: docId } }],
    },
  })
}

export async function listDocuments(): Promise<
  { docId: string; filename: string; chunkCount: number }[]
> {
  // Scroll all points and aggregate by docId
  const { points } = await client.scroll(COLLECTION, {
    with_payload: true,
    limit: 10000,
  })

  const map = new Map<string, { filename: string; count: number }>()
  for (const p of points) {
    const payload = p.payload as ChunkPayload
    if (!map.has(payload.docId)) {
      map.set(payload.docId, { filename: payload.filename, count: 0 })
    }
    map.get(payload.docId)!.count++
  }

  return Array.from(map.entries()).map(([docId, { filename, count }]) => ({
    docId,
    filename,
    chunkCount: count,
  }))
}
