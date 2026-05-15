import { useState, useEffect } from 'react'
import { subscribeConnections } from '../services/connections'
import type { Connection } from '../types'

export const useConnections = (userId: string | undefined) => {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setConnections([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeConnections(userId, (data) => {
      setConnections(data)
      setLoading(false)
    })
    return unsub
  }, [userId])

  return { connections, loading }
}
