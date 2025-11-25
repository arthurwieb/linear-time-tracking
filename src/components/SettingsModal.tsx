import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Linear Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="token" className="text-zinc-400">Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-zinc-50 focus-visible:ring-indigo-500"
              placeholder="lin_api_..."
            />
            <p className="text-xs text-zinc-500">
              Generate a token in your Linear Settings &gt; API.
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Save Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
