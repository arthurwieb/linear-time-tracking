import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchIssues, LinearIssue } from '../../utils/linear'
import { startTimer } from '../../utils/timer'
import { useAuth } from '../../context/AuthContext'
import { SettingsModal } from '../../components/SettingsModal'
import { Settings, Play, CheckCircle2, Circle } from 'lucide-react'

export const Route = createFileRoute('/_auth/')({
  component: Dashboard,
})

function Dashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { user } = useAuth()

  const { data: issues, isLoading, error } = useQuery({
    queryKey: ['issues'],
    queryFn: fetchIssues,
    retry: false,
  })

  // Group issues by Cycle
  const issuesByCycle = issues?.reduce((acc, issue) => {
    const cycleName = issue.cycle ? `Cycle ${issue.cycle.number}` : 'No Cycle'
    if (!acc[cycleName]) acc[cycleName] = []
    acc[cycleName].push(issue)
    return acc
  }, {} as Record<string, LinearIssue[]>)

  // Sort cycles (reverse order for cycles, "No Cycle" last)
  const sortedCycles = Object.keys(issuesByCycle || {}).sort((a, b) => {
    if (a === 'No Cycle') return 1
    if (b === 'No Cycle') return -1
    return b.localeCompare(a)
  })

  return (
    <div className="h-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">My Issues</h1>
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

      <div className="space-y-8">
        {sortedCycles.map((cycle) => (
          <div key={cycle}>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              {cycle}
            </h3>
            <div className="space-y-2">
              {issuesByCycle?.[cycle].map((issue) => (
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
                  <button
                    className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 opacity-0 transition-opacity hover:bg-zinc-700 hover:text-zinc-50 group-hover:opacity-100"
                    onClick={() => {
                      if (user) {
                        startTimer(user.uid, issue)
                      }
                    }}
                  >
                    <Play className="h-3 w-3" />
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
