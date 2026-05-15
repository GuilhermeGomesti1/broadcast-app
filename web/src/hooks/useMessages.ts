import { useState, useEffect } from 'react'
import { subscribeMessages } from '../services/messages'
import type { Message, MessageStatus } from '../types'

export const useMessages = (
  userId: string | undefined,
  connectionId: string | undefined,
  statusFilter: MessageStatus | 'all'
) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !connectionId) {
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeMessages(userId, connectionId, statusFilter, (data) => {
      setMessages(data)
      setLoading(false)
    })
    return unsub
  }, [userId, connectionId, statusFilter])

  return { messages, loading }
}
