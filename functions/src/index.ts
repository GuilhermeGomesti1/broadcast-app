import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'

admin.initializeApp()

const db = admin.firestore()

export const processScheduledMessages = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'America/Sao_Paulo',
  },
  async () => {
    const now = Date.now()

    const snap = await db
      .collection('messages')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .get()

    if (snap.empty) return

    const batch = db.batch()
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'sent', sentAt: now })
    })

    await batch.commit()
    console.log(`Processed ${snap.size} scheduled message(s).`)
  }
)
