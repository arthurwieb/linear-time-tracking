import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface TimeLog {
  id: string
  userId: string
  issueId: string
  issueTitle: string
  issueIdentifier: string
  startTime: Timestamp
  endTime: Timestamp | null
  estimate?: string // e.g., "25m", "1h"
}

export const startTimer = async (
  userId: string,
  issue: { id: string; title: string; identifier: string }
) => {
  // 1. Stop any currently active timer for this user
  const activeQuery = query(
    collection(db, 'time_logs'),
    where('userId', '==', userId),
    where('endTime', '==', null)
  )
  const snapshot = await getDocs(activeQuery)

  const batchPromises = snapshot.docs.map((d) =>
    updateDoc(doc(db, 'time_logs', d.id), { endTime: serverTimestamp() })
  )
  await Promise.all(batchPromises)

  // 2. Start new timer
  await addDoc(collection(db, 'time_logs'), {
    userId,
    issueId: issue.id,
    issueTitle: issue.title,
    issueIdentifier: issue.identifier,
    startTime: serverTimestamp(),
    endTime: null,
  })
}

export const stopTimer = async (timerId: string) => {
  await updateDoc(doc(db, 'time_logs', timerId), {
    endTime: serverTimestamp(),
  })
}

export const updateEstimate = async (timerId: string, estimate: string) => {
  await updateDoc(doc(db, 'time_logs', timerId), {
    estimate,
  })
}
