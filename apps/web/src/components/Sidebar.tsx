import { MessageSquare, Plus, Upload } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Conversation } from '../types'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onNew: () => void
  onSelect: (id: string) => void
}

export function Sidebar({ conversations, activeId, onNew, onSelect }: Props) {
  const navigate = useNavigate()

  return (
    <aside
      className="flex flex-col w-64 flex-shrink-0 h-full"
      style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.8)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <MessageSquare size={14} style={{ color: '#22C55E' }} />
        </div>
        <span className="text-sm font-semibold tracking-tight font-mono" style={{ color: '#F8FAFC' }}>
          RAG Chat
        </span>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)' }}
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs" style={{ color: '#475569' }}>
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 cursor-pointer truncate"
              style={{
                color: activeId === conv.id ? '#F8FAFC' : '#94A3B8',
                background: activeId === conv.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (activeId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={(e) => {
                if (activeId !== conv.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              {conv.title}
            </button>
          ))
        )}
      </div>

      {/* Upload docs link */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          to="/upload"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 cursor-pointer"
          style={{ color: '#64748B' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#94A3B8'
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748B'
            e.currentTarget.style.background = 'transparent'
          }}
          onClick={() => navigate('/upload')}
        >
          <Upload size={14} />
          Manage Documents
        </Link>
      </div>
    </aside>
  )
}
