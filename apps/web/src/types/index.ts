export interface Source {
  filename: string
  chunkIndex: number
  excerpt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  streaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

export interface Document {
  docId: string
  filename: string
  chunkCount: number
}
