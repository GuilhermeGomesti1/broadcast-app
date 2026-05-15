import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Message, MessageStatus } from '../types'

const col = collection(db, 'messages')

export const subscribeMessages = (
  userId: string,
  connectionId: string,
  statusFilter: MessageStatus | 'all',
  callback: (messages: Message[]) => void
) => {
  const constraints = [
    where('userId', '==', userId),
    where('connectionId', '==', connectionId),
    orderBy('createdAt', 'desc'),
  ]

  if (statusFilter !== 'all') {
    constraints.splice(2, 0, where('status', '==', statusFilter))
  }

  const q = query(col, ...constraints)
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Message)))
  })
}

export const createMessage = (
  userId: string,
  connectionId: string,
  contactIds: string[],
  content: string,
  scheduledAt: number
) =>
  addDoc(col, {
    userId,
    connectionId,
    contactIds,
    content,
    status: 'scheduled' as MessageStatus,
    scheduledAt,
    sentAt: null,
    createdAt: Date.now(),
  })

export const updateMessage = (
  id: string,
  data: { content?: string; contactIds?: string[]; scheduledAt?: number }
) => updateDoc(doc(db, 'messages', id), data)

export const deleteMessage = (id: string) =>
  deleteDoc(doc(db, 'messages', id))
