import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import { fetchIssues, fetchCycles, LinearIssue, LinearCycle } from '../../utils/linear'
import { startTimer, stopTimer } from '../../utils/timer'
import { useAuth } from '../../context/AuthContext'
import { useTimer } from '../../context/TimerContext'
import { SettingsModal } from '../../components/SettingsModal'
import { Settings, Play, CheckCircle2, Circle, Clock, StopCircle } from 'lucide-react'
import { loadEstimates, saveEstimates } from '../../utils/estimates'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../utils/firebase'

export const Route = createFileRoute('/_auth/')({
  component: Dashboard,
})

function Dashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [estimates, setEstimates] = useState<Record<string, number>>({})
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({})
  const { user } = useAuth()
  const { activeTimer } = useTimer()

  const { data: issues, isLoading, error } = useQuery({
    queryKey: ['issues'],
    queryFn: fetchIssues,
    retry: false,
  })

  const { data: cycles } = useQuery({
    queryKey: ['cycles'],
    queryFn: fetchCycles,
    retry: false,
  })

  // Load estimates from Firebase on mount
  useEffect(() => {
    if (user) {
      loadEstimates(user.uid).then(setEstimates)
    }
  }, [user])

  // Real-time listener for time spent updates
  useEffect(() => {
    if (!user) {
      setTimeSpent({})
      return
    }

    // Set up real-time listener for time logs
    const logsQuery = query(
      collection(db, 'time_logs'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const timeSpentData: Record<string, number> = {}

      snapshot.docs.forEach((doc) => {
        const log = doc.data()

        // Only count completed logs (with endTime)
        if (log.endTime && log.startTime) {
          const start = log.startTime.toDate()
          const end = log.endTime.toDate()

          const durationMs = end.getTime() - start.getTime()
          const durationHours = durationMs / (1000 * 60 * 60)

          if (!timeSpentData[log.issueId]) {
            timeSpentData[log.issueId] = 0
          }
          timeSpentData[log.issueId] += durationHours
        }
      })

      setTimeSpent(timeSpentData)
    })

    return () => unsubscribe()
  }, [user])

  // Save estimates to Firebase when they change
  useEffect(() => {
    if (user && Object.keys(estimates).length > 0) {
      saveEstimates(user.uid, estimates)
    }
  }, [estimates, user])

  // Calculate total estimated hours
  const totalHours = useMemo(() => {
    return Object.values(estimates).reduce((sum, estimate) => sum + estimate, 0)
  }, [estimates])

  // Format time spent in hours and minutes
  const formatTimeSpent = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)

    if (h === 0) {
      return `${m}m`
    } else if (m === 0) {
      return `${h}h`
    } else {
      return `${h}h ${m}m`
    }
  }

  // Determine Current and Next Cycle
  const sortedCyclesData = useMemo(() => {
    if (!cycles) return { current: null, next: null }
    const sorted = [...cycles].sort((a, b) => a.number - b.number)

    // Find current cycle by checking if now is between startsAt and endsAt
    const now = new Date()
    const current = sorted.find(c => {
      const start = new Date(c.startsAt)
      const end = new Date(c.endsAt)
      return now >= start && now <= end
    })

    const next = current ? sorted.find(c => c.number === current.number + 1) : sorted[0] // Fallback if no current
    return { current, next }
  }, [cycles])

  // Group issues
  const { currentCycleIssues, nextCycleIssues, backlogIssues } = useMemo(() => {
    if (!issues) return { currentCycleIssues: [], nextCycleIssues: [], backlogIssues: [] }

    const current = []
    const next = []
    const backlog = []

    for (const issue of issues) {
      if (issue.cycle?.id === sortedCyclesData.current?.id) {
        current.push(issue)
      } else if (issue.cycle?.id === sortedCyclesData.next?.id) {
        next.push(issue)
      } else {
        backlog.push(issue)
      }
    }

    return { currentCycleIssues: current, nextCycleIssues: next, backlogIssues: backlog }
  }, [issues, sortedCyclesData])

  return (
    <div className="h-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-zinc-50">My Issues</h1>
          <div className="flex items-center gap-2 rounded-md border border-indigo-900/50 bg-indigo-900/20 px-3 py-1.5">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">
              {totalHours}h total
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {isLoading && <div className="text-zinc-400">Loading issues...</div>}

      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-900/20 p-4 text-red-200">
          <p>Failed to load issues. Please check your API Token.</p>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="mt-2 text-sm font-medium underline"
          >
            Open Settings
          </button>
        </div>
      )}

      {!isLoading && !error && issues?.length === 0 && (
        <div className="text-zinc-400">No active issues found.</div>
      )}


      <div className="space-y-12">
        {/* Current Cycle */}
        {sortedCyclesData.current && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6 shadow-lg shadow-indigo-500/10">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-indigo-100">
                    Current Cycle {sortedCyclesData.current.number}
                  </h3>
                  <p className="text-xs text-indigo-400/80">
                    {new Date(sortedCyclesData.current.startsAt).toLocaleDateString()} - {new Date(sortedCyclesData.current.endsAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
                {currentCycleIssues.length} issues
              </div>
            </div>

            <div className="space-y-2">
              {currentCycleIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="group flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-zinc-500">
                      {issue.state.name === 'Done' ? (
                        <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500">{issue.identifier}</span>
                        <h4 className="font-medium text-zinc-200">{issue.title}</h4>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: issue.state.color }}
                        />
                        {issue.state.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {issue.assignee && (
                      <div className="flex items-center gap-2" title={issue.assignee.name}>
                        {issue.assignee.avatarUrl ? (
                          <img
                            src={issue.assignee.avatarUrl}
                            alt={issue.assignee.name}
                            className="h-6 w-6 rounded-full border border-zinc-800"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-800 text-xs font-medium text-zinc-400">
                            {issue.assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-zinc-400">{issue.assignee.name}</span>
                      </div>
                    )}
                    {!issue.assignee && (
                      <div className="flex items-center gap-2" title="Unassigned">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-600 border-dashed">
                          <span className="text-xs">?</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={estimates[issue.id] || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setEstimates(prev => ({ ...prev, [issue.id]: value }))
                        }}
                        className="w-16 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        title="Estimate"
                      />
                      <span className="text-xs text-zinc-500">h</span>
                    </div>
                    {timeSpent[issue.id] && (
                      <div className="flex items-center gap-1 rounded border border-amber-900/50 bg-amber-900/20 px-2 py-1">
                        <span className="text-xs text-amber-400">
                          {formatTimeSpent(timeSpent[issue.id])} spent
                        </span>
                      </div>
                    )}
                    <button
                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        activeTimer?.issueId === issue.id
                          ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40'
                          : activeTimer
                            ? 'cursor-not-allowed bg-zinc-800 text-zinc-600 opacity-50'
                            : 'bg-zinc-800 text-zinc-300 opacity-0 hover:bg-zinc-700 hover:text-zinc-50 group-hover:opacity-100'
                      }`}
                      onClick={() => {
                        if (user) {
                          if (activeTimer?.issueId === issue.id) {
                            stopTimer(activeTimer.id)
                          } else if (!activeTimer) {
                            startTimer(user.uid, issue).catch((err) => {
                              alert(err.message)
                            })
                          }
                        }
                      }}
                      disabled={!!activeTimer && activeTimer.issueId !== issue.id}
                    >
                      {activeTimer?.issueId === issue.id ? (
                        <>
                          <StopCircle className="h-3 w-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Start
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {currentCycleIssues.length === 0 && (
                <div className="py-8 text-center text-zinc-500">
                  No issues in the current cycle.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backlog / Other Issues */}
        {backlogIssues.length > 0 && (
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-500">
              <Circle className="h-4 w-4" />
              Backlog & Other Cycles
            </h3>
            <div className="space-y-2 pl-2 border-l-2 border-zinc-800">
              {backlogIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="group flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-zinc-500">
                      {issue.state.name === 'Done' ? (
                        <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500">{issue.identifier}</span>
                        <h4 className="font-medium text-zinc-200">{issue.title}</h4>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: issue.state.color }}
                        />
                        {issue.state.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {issue.assignee && (
                      <div className="flex items-center gap-2" title={issue.assignee.name}>
                        {issue.assignee.avatarUrl ? (
                          <img
                            src={issue.assignee.avatarUrl}
                            alt={issue.assignee.name}
                            className="h-6 w-6 rounded-full border border-zinc-800"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-800 text-xs font-medium text-zinc-400">
                            {issue.assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-zinc-400">{issue.assignee.name}</span>
                      </div>
                    )}
                    {!issue.assignee && (
                      <div className="flex items-center gap-2" title="Unassigned">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-600 border-dashed">
                          <span className="text-xs">?</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={estimates[issue.id] || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setEstimates(prev => ({ ...prev, [issue.id]: value }))
                        }}
                        className="w-16 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        title="Estimate"
                      />
                      <span className="text-xs text-zinc-500">h</span>
                    </div>
                    {timeSpent[issue.id] && (
                      <div className="flex items-center gap-1 rounded border border-amber-900/50 bg-amber-900/20 px-2 py-1">
                        <span className="text-xs text-amber-400">
                          {formatTimeSpent(timeSpent[issue.id])} spent
                        </span>
                      </div>
                    )}
                    <button
                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        activeTimer?.issueId === issue.id
                          ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40'
                          : activeTimer
                            ? 'cursor-not-allowed bg-zinc-800 text-zinc-600 opacity-50'
                            : 'bg-zinc-800 text-zinc-300 opacity-0 hover:bg-zinc-700 hover:text-zinc-50 group-hover:opacity-100'
                      }`}
                      onClick={() => {
                        if (user) {
                          if (activeTimer?.issueId === issue.id) {
                            stopTimer(activeTimer.id)
                          } else if (!activeTimer) {
                            startTimer(user.uid, issue).catch((err) => {
                              alert(err.message)
                            })
                          }
                        }
                      }}
                      disabled={!!activeTimer && activeTimer.issueId !== issue.id}
                    >
                      {activeTimer?.issueId === issue.id ? (
                        <>
                          <StopCircle className="h-3 w-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Start
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Cycle */}
        {sortedCyclesData.next && (
          <div className="opacity-75 hover:opacity-100 transition-opacity">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-500">
              <Clock className="h-4 w-4" />
              Next Cycle {sortedCyclesData.next.number}
            </h3>
            <div className="space-y-2 bg-zinc-900/30 p-4 rounded-lg border border-zinc-800/50 border-dashed">
              {nextCycleIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="group flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-zinc-500">
                      {issue.state.name === 'Done' ? (
                        <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500">{issue.identifier}</span>
                        <h4 className="font-medium text-zinc-200">{issue.title}</h4>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: issue.state.color }}
                        />
                        {issue.state.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {issue.assignee && (
                      <div className="flex items-center gap-2" title={issue.assignee.name}>
                        {issue.assignee.avatarUrl ? (
                          <img
                            src={issue.assignee.avatarUrl}
                            alt={issue.assignee.name}
                            className="h-6 w-6 rounded-full border border-zinc-800"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-800 text-xs font-medium text-zinc-400">
                            {issue.assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-zinc-400">{issue.assignee.name}</span>
                      </div>
                    )}
                    {!issue.assignee && (
                      <div className="flex items-center gap-2" title="Unassigned">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-600 border-dashed">
                          <span className="text-xs">?</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={estimates[issue.id] || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setEstimates(prev => ({ ...prev, [issue.id]: value }))
                        }}
                        className="w-16 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        title="Estimate"
                      />
                      <span className="text-xs text-zinc-500">h</span>
                    </div>
                    {timeSpent[issue.id] && (
                      <div className="flex items-center gap-1 rounded border border-amber-900/50 bg-amber-900/20 px-2 py-1">
                        <span className="text-xs text-amber-400">
                          {formatTimeSpent(timeSpent[issue.id])} spent
                        </span>
                      </div>
                    )}
                    <button
                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        activeTimer?.issueId === issue.id
                          ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40'
                          : activeTimer
                            ? 'cursor-not-allowed bg-zinc-800 text-zinc-600 opacity-50'
                            : 'bg-zinc-800 text-zinc-300 opacity-0 hover:bg-zinc-700 hover:text-zinc-50 group-hover:opacity-100'
                      }`}
                      onClick={() => {
                        if (user) {
                          if (activeTimer?.issueId === issue.id) {
                            stopTimer(activeTimer.id)
                          } else if (!activeTimer) {
                            startTimer(user.uid, issue).catch((err) => {
                              alert(err.message)
                            })
                          }
                        }
                      }}
                      disabled={!!activeTimer && activeTimer.issueId !== issue.id}
                    >
                      {activeTimer?.issueId === issue.id ? (
                        <>
                          <StopCircle className="h-3 w-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Start
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {nextCycleIssues.length === 0 && (
                <div className="py-4 text-center text-sm text-zinc-600">
                  No issues planned for the next cycle yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
