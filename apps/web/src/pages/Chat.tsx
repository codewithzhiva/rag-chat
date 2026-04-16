import { ArrowUp, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageBubble } from '../components/MessageBubble'
import { Sidebar } from '../components/Sidebar'
import { useStream } from '../hooks/useStream'
import type { Conversation, Message, Source } from '../types'
import { v4 as uuidv4 } from '../lib/uuid'

function createConversation(): Conversation {
  return { id: uuidv4(), title: 'New Chat', messages: [], createdAt: Date.now() }
}

export function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation()])
  const [activeId, setActiveId] = useState<string>(conversations[0].id)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { send, abort, streaming } = useStream()

  const active = conversations.find((c) => c.id === activeId)!

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
  }, [])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [active.messages.length, scrollToBottom])

  const submit = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: Message = { id: uuidv4(), role: 'user', content: text }
    const assistantId = uuidv4()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true }

    updateConversation(activeId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? text.slice(0, 40) : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
    }))

    await send(text, {
      onToken: (token) => {
        updateConversation(activeId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        }))
      },
      onSources: (sources: Source[]) => {
        updateConversation(activeId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, sources } : m,
          ),
        }))
      },
      onDone: () => {
        updateConversation(activeId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        }))
      },
      onError: (err) => {
        updateConversation(activeId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, content: `Error: ${err}`, streaming: false } : m,
          ),
        }))
      },
    })
  }, [input, streaming, activeId, send, updateConversation])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex h-full" style={{ background: '#0F172A' }}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNew={() => {
          const c = createConversation()
          setConversations((prev) => [c, ...prev])
          setActiveId(c.id)
        }}
        onSelect={setActiveId}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div
          className="flex items-center px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="text-sm font-semibold font-mono" style={{ color: '#F8FAFC' }}>
              {active.title}
            </h1>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#475569' }}>
              llama3.1 · nomic-embed-text · qdrant
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {active.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#475569' }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-lg font-mono" style={{ color: '#22C55E' }}>›_</span>
              </div>
              <p className="text-sm font-mono">Ask anything about your documents</p>
            </div>
          )}
          {active.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 px-6 pb-6 pt-3">
          <div
            className="flex items-end gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
              style={{
                color: '#F8FAFC',
                fontFamily: 'inherit',
                maxHeight: '160px',
                minHeight: '24px',
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${el.scrollHeight}px`
              }}
            />
            <button
              onClick={streaming ? abort : submit}
              disabled={!streaming && !input.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: streaming ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                border: streaming ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
              }}
            >
              {streaming
                ? <Square size={13} style={{ color: '#EF4444' }} />
                : <ArrowUp size={14} style={{ color: '#22C55E' }} />
              }
            </button>
          </div>
          <p className="text-xs mt-2 text-center font-mono" style={{ color: '#334155' }}>
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  )
}
