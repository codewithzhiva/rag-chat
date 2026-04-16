import { FileText } from 'lucide-react'
import type { Source } from '../types'

interface Props {
  source: Source
  index: number
}

export function SourceCard({ source, index }: Props) {
  return (
    <div
      className="flex-shrink-0 w-64 rounded-lg p-3 cursor-default transition-colors duration-200"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(34,197,94,0.08)'
        e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex items-center justify-center w-5 h-5 rounded text-xs font-mono font-semibold flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
        >
          {index + 1}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
          <span
            className="text-xs font-mono truncate"
            style={{ color: '#94A3B8' }}
            title={source.filename}
          >
            {source.filename}
          </span>
        </div>
      </div>
      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#CBD5E1' }}>
        {source.excerpt}
      </p>
    </div>
  )
}
