import { Bot, User } from 'lucide-react'
import { SourceCard } from './SourceCard'
import type { Message } from '../types'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 group">
        <div
          className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', color: '#F8FAFC' }}
        >
          {message.content}
        </div>
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: 'rgba(34,197,94,0.2)' }}
        >
          <User size={14} style={{ color: '#22C55E' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 group">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Bot size={14} style={{ color: '#94A3B8' }} />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed${message.streaming ? ' streaming-cursor' : ''}`}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#E2E8F0',
            fontFamily: message.content ? 'inherit' : undefined,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content || (
            <span className="flex gap-1 items-center" style={{ color: '#64748B' }}>
              <span className="skeleton inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span className="skeleton inline-block w-1.5 h-1.5 rounded-full bg-slate-500" style={{ animationDelay: '0.2s' }} />
              <span className="skeleton inline-block w-1.5 h-1.5 rounded-full bg-slate-500" style={{ animationDelay: '0.4s' }} />
            </span>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div>
            <p className="text-xs mb-2 font-mono" style={{ color: '#64748B' }}>
              {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {message.sources.map((src, i) => (
                <SourceCard key={`${src.filename}-${src.chunkIndex}`} source={src} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
