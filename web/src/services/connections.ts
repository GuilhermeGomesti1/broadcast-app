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
import type { Connection } from '../types'

const col = collection(db, 'connections')

export const subscribeConnections = (
  userId: string,
  callback: (connections: Connection[]) => void
) => {
  const q = query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Connection)))
  })
}

export const createConnection = (userId: string, name: string) =>
  addDoc(col, { userId, name, createdAt: Date.now() })

export const updateConnection = (id: string, name: string) =>
  updateDoc(doc(db, 'connections', id), { name })

export const deleteConnection = (id: string) =>
  deleteDoc(doc(db, 'connections', id))
