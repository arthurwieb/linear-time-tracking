import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [token, setToken] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    const storedToken = localStorage.getItem('linear_api_token')
    if (storedToken) {
      setToken(storedToken)
    } else if (import.meta.env.VITE_LINEAR_API_KEY) {
      setToken(import.meta.env.VITE_LINEAR_API_KEY)
    }
  }, [isOpen])

  const handleSave = () => {
    localStorage.setItem('linear_api_token', token)
    queryClient.invalidateQueries({ queryKey: ['issues'] })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-zinc-50">Linear Settings</h2>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 focus:border-indigo-500 focus:outline-none"
            placeholder="lin_api_..."
          />
          <p className="mt-2 text-xs text-zinc-500">
            Generate a token in your Linear Settings &gt; API.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save Token
          </button>
        </div>
      </div>
    </div>
  )
}
