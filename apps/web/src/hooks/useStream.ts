import { useCallback, useRef, useState } from 'react'
import type { Source } from '../types'

interface StreamCallbacks {
  onToken: (token: string) => void
  onSources: (sources: Source[]) => void
  onDone: () => void
  onError: (msg: string) => void
}

export function useStream() {
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(async (message: string, callbacks: StreamCallbacks) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        callbacks.onError('Failed to connect to API')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.type === 'token') callbacks.onToken(payload.content)
            else if (payload.type === 'sources') callbacks.onSources(payload.sources)
            else if (payload.type === 'done') callbacks.onDone()
            else if (payload.type === 'error') callbacks.onError(payload.content)
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        callbacks.onError('Stream interrupted')
      }
    } finally {
      setStreaming(false)
    }
  }, [])

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
  }, [])

  return { send, abort, streaming }
}
