import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../utils/firebase'
import { useAuth } from '../context/AuthContext'
import { TimeLog, stopTimer, updateEstimate } from '../utils/timer'
import { StopCircle, Clock } from 'lucide-react'

export function ActiveTimer() {
  const { user } = useAuth()
  const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [estimateInput, setEstimateInput] = useState('')

  useEffect(() => {
    if (!user) {
      setActiveTimer(null)
      return
    }

    const q = query(
      collection(db, 'time_logs'),
      where('userId', '==', user.uid),
      where('endTime', '==', null)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        setActiveTimer({ id: doc.id, ...data } as TimeLog)
        if (data.estimate) setEstimateInput(data.estimate)
      } else {
        setActiveTimer(null)
        setEstimateInput('')
      }
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0)
      return
    }

    const interval = setInterval(() => {
      const now = new Date()
      const start = activeTimer.startTime instanceof Timestamp
        ? activeTimer.startTime.toDate()
        : new Date() // Fallback or handle pending writes

      const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
      setElapsed(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeTimer])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleEstimateBlur = () => {
    if (activeTimer && estimateInput !== activeTimer.estimate) {
      updateEstimate(activeTimer.id, estimateInput)
    }
  }

  if (!activeTimer) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500">{activeTimer.issueIdentifier}</span>
              <span className="font-medium text-zinc-200">{activeTimer.issueTitle}</span>
            </div>
            <div className="text-2xl font-mono font-bold text-zinc-50">{formatTime(elapsed)}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <label className="text-xs text-zinc-500">Estimate</label>
            <input
              type="text"
              value={estimateInput}
              onChange={(e) => setEstimateInput(e.target.value)}
              onBlur={handleEstimateBlur}
              placeholder="e.g. 25m"
              className="w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => stopTimer(activeTimer.id)}
            className="flex items-center gap-2 rounded-md bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
          >
            <StopCircle className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>
    </div>
  )
}
