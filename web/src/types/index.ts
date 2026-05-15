export interface Connection {
  id: string
  userId: string
  name: string
  createdAt: number
}

export interface Contact {
  id: string
  userId: string
  connectionId: string
  name: string
  phone: string
  createdAt: number
}

export type MessageStatus = 'scheduled' | 'sent'

export interface Message {
  id: string
  userId: string
  connectionId: string
  contactIds: string[]
  content: string
  status: MessageStatus
  scheduledAt: number
  sentAt: number | null
  createdAt: number
}
