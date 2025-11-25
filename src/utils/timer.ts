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
  // 1. Check if there is already an active timer
  const activeQuery = query(
    collection(db, 'time_logs'),
    where('userId', '==', userId),
    where('endTime', '==', null)
  )
  const snapshot = await getDocs(activeQuery)

  if (!snapshot.empty) {
    throw new Error('A timer is already running. Please stop it first.')
  }

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

/**
 * Calculate total time spent (in hours) for each issue from time logs
 */
export const getTimeSpentPerIssue = async (
  userId: string
): Promise<Record<string, number>> => {
  try {
    const logsQuery = query(
      collection(db, 'time_logs'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(logsQuery)

    const timeSpent: Record<string, number> = {}

    snapshot.docs.forEach((doc) => {
      const log = doc.data() as Omit<TimeLog, 'id'>

      // Only count completed logs (with endTime)
      if (log.endTime && log.startTime) {
        const start = log.startTime instanceof Timestamp
          ? log.startTime.toDate()
          : new Date(log.startTime)
        const end = log.endTime instanceof Timestamp
          ? log.endTime.toDate()
          : new Date(log.endTime)

        const durationMs = end.getTime() - start.getTime()
        const durationHours = durationMs / (1000 * 60 * 60)

        if (!timeSpent[log.issueId]) {
          timeSpent[log.issueId] = 0
        }
        timeSpent[log.issueId] += durationHours
      }
    })

    return timeSpent
  } catch (error) {
    console.error('Error calculating time spent:', error)
    return {}
  }
}
