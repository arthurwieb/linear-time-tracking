import { useEffect, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useTimer } from '../context/TimerContext'
import { stopTimer, updateEstimate } from '../utils/timer'
import { StopCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ActiveTimer() {
  const { activeTimer } = useTimer()
  const [elapsed, setElapsed] = useState(0)
  const [estimateInput, setEstimateInput] = useState('')

  useEffect(() => {
    if (activeTimer?.estimate) {
      setEstimateInput(activeTimer.estimate)
    } else {
      setEstimateInput('')
    }
  }, [activeTimer])

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
          <Button
            variant="destructive"
            size="sm"
            onClick={() => stopTimer(activeTimer.id)}
            className="ml-4"
          >
            <StopCircle className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>


      </div>
    </div>
  )
}
