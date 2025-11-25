import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../utils/firebase'
import { useAuth } from './AuthContext'
import { TimeLog } from '../utils/timer'

interface TimerContextType {
  activeTimer: TimeLog | null
  isLoading: boolean
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setActiveTimer(null)
      setIsLoading(false)
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
      } else {
        setActiveTimer(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return (
    <TimerContext.Provider value={{ activeTimer, isLoading }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}
