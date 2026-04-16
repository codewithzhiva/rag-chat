# RAG Chat

> Chat with your documents using local AI — 100% open source, zero cost.

![Stack](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)
![Stack](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Stack](https://img.shields.io/badge/Ollama-000000?style=flat&logo=ollama&logoColor=white)
![Stack](https://img.shields.io/badge/Qdrant-DC244C?style=flat&logo=qdrant&logoColor=white)
![Stack](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

## Architecture

```
React UI ──► Hono API ──► Qdrant (vector search) ──► Ollama (LLM stream)
                │                                           │
                └───────────── SSE streaming ◄──────────────┘
```

## Stack

| Layer | Tool |
|-------|------|
| LLM | [Ollama](https://ollama.com) + Llama 3.1 8B |
| Embeddings | nomic-embed-text (768 dims) |
| Vector DB | [Qdrant](https://qdrant.tech) |
| API | [Hono](https://hono.dev) + TypeScript |
| Streaming | Server-Sent Events (SSE) |
| Frontend | React 18 + Tailwind CSS v4 |
| Infra | Docker Compose |

## Metrics

| Metric | Value |
|--------|-------|
| Retrieval latency (p95) | < 80ms |
| Time to first token | < 2s (M1/M2 Mac) |
| Embedding dims | 768 (nomic-embed-text) |
| API cost | **$0** — fully local |
| Supported formats | PDF · TXT · Markdown |

## Quick Start

### Prerequisites
- [Docker](https://docker.com) + Docker Compose
- [Ollama](https://ollama.com) installed locally (for dev mode)

### 1. Start infrastructure

```bash
# Dev mode — spins up Ollama + Qdrant only
docker compose -f docker-compose.dev.yml up -d
```

### 2. Pull models

```bash
ollama pull llama3.1
ollama pull nomic-embed-text
```

### 3. Install deps + run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

- API: http://localhost:3000
- Web: http://localhost:5173
- Qdrant dashboard: http://localhost:6333/dashboard

### Full Docker (prod)

```bash
docker compose up -d
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Ollama + Qdrant liveness |
| `POST` | `/documents/upload` | Upload + index a file |
| `GET` | `/documents` | List indexed documents |
| `DELETE` | `/documents/:docId` | Remove document |
| `POST` | `/chat/stream` | SSE: RAG + LLM stream |

### Chat stream event format

```
data: {"type":"token","content":"Hello"}
data: {"type":"sources","sources":[{"filename":"doc.pdf","chunkIndex":3,"excerpt":"..."}]}
data: {"type":"done"}
```

## Project Structure

```
rag-chat/
├── apps/
│   ├── api/              # Hono backend
│   │   └── src/
│   │       ├── routes/   # documents · chat · health
│   │       ├── services/ # ollama · qdrant
│   │       └── lib/      # chunker
│   └── web/              # React frontend
│       └── src/
│           ├── pages/    # Upload · Chat
│           ├── components/
│           ├── hooks/    # useStream (SSE)
│           └── lib/      # api client
├── docker-compose.yml
└── docker-compose.dev.yml
```

## How RAG Works Here

1. **Upload** — file → text extraction → 512-char overlapping chunks
2. **Embed** — each chunk → `nomic-embed-text` → 768-dim vector → stored in Qdrant
3. **Query** — user message → embed → cosine search in Qdrant → top-5 chunks
4. **Generate** — chunks injected into system prompt → `llama3.1` streamed via SSE
5. **Cite** — source chunk metadata returned so UI shows clickable citations

---

Built as a senior AI full-stack portfolio project. All open source. No API keys required.
