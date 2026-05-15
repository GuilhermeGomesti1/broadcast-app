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
import type { Contact } from '../types'

const col = collection(db, 'contacts')

export const subscribeContacts = (
  userId: string,
  connectionId: string,
  callback: (contacts: Contact[]) => void
) => {
  const q = query(
    col,
    where('userId', '==', userId),
    where('connectionId', '==', connectionId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Contact)))
  })
}

export const createContact = (userId: string, connectionId: string, name: string, phone: string) =>
  addDoc(col, { userId, connectionId, name, phone, createdAt: Date.now() })

export const updateContact = (id: string, name: string, phone: string) =>
  updateDoc(doc(db, 'contacts', id), { name, phone })

export const deleteContact = (id: string) =>
  deleteDoc(doc(db, 'contacts', id))
