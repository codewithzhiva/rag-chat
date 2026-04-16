import { FileText, Loader2, MessageSquare, Trash2, Upload as UploadIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDocument, fetchDocuments, uploadDocument } from '../lib/api'
import type { Document } from '../types'

export function Upload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadDocs = useCallback(async () => {
    try {
      const { documents } = await fetchDocuments()
      setDocuments(documents)
    } catch {
      setError('Failed to load documents')
    }
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  const handleUpload = useCallback(async (file: File) => {
    setError(null)
    setSuccess(null)
    setUploading(true)
    try {
      const res = await uploadDocument(file)
      setSuccess(`"${file.name}" indexed — ${res.chunkCount} chunks`)
      await loadDocs()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }, [loadDocs])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDelete = useCallback(async (docId: string) => {
    try {
      await deleteDocument(docId)
      setDocuments((prev) => prev.filter((d) => d.docId !== docId))
    } catch {
      setError('Failed to delete document')
    }
  }, [])

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#0F172A' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <MessageSquare size={14} style={{ color: '#22C55E' }} />
          </div>
          <span className="text-sm font-semibold font-mono" style={{ color: '#F8FAFC' }}>RAG Chat</span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer font-mono"
          style={{ color: '#22C55E', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.15)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)' }}
        >
          <MessageSquare size={13} />
          Go to Chat
        </Link>
      </nav>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: '#F8FAFC' }}>Documents</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
            Upload PDF, TXT, or Markdown files to index them for retrieval.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="relative flex flex-col items-center justify-center gap-4 rounded-xl py-14 transition-all duration-200 cursor-pointer"
          style={{
            border: `2px dashed ${dragOver ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
            background: dragOver ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
          }}
          onMouseEnter={(e) => {
            if (!dragOver) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={(e) => {
            if (!dragOver) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />
          {uploading ? (
            <>
              <Loader2 size={28} className="animate-spin" style={{ color: '#22C55E' }} />
              <p className="text-sm font-mono" style={{ color: '#64748B' }}>Indexing document…</p>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <UploadIcon size={20} style={{ color: '#22C55E' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#CBD5E1' }}>
                  Drop file here or click to browse
                </p>
                <p className="text-xs mt-1 font-mono" style={{ color: '#475569' }}>
                  PDF · TXT · MD — max 10MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* Feedback messages */}
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-mono"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#86EFAC' }}
          >
            {success}
          </div>
        )}

        {/* Document list */}
        {documents.length > 0 && (
          <div>
            <h2 className="text-xs font-mono mb-3 uppercase tracking-widest" style={{ color: '#475569' }}>
              Indexed — {documents.length} doc{documents.length !== 1 ? 's' : ''}
            </h2>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.docId}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <FileText size={15} style={{ color: '#475569', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-mono" style={{ color: '#CBD5E1' }}>{doc.filename}</p>
                    <p className="text-xs font-mono" style={{ color: '#475569' }}>{doc.chunkCount} chunks</p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.docId)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer"
                    style={{ color: '#475569' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                      e.currentTarget.style.color = '#EF4444'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#475569'
                    }}
                    aria-label={`Delete ${doc.filename}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length === 0 && !uploading && (
          <p className="text-sm text-center font-mono" style={{ color: '#334155' }}>
            No documents indexed yet
          </p>
        )}
      </main>
    </div>
  )
}
