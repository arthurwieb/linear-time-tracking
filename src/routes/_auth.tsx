import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'
import { auth } from '../utils/firebase'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    // Wait for auth state to be determined
    const user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe()
        resolve(user)
      })
    })

    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-zinc-50">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50">
      {/* Sidebar will go here */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-8 font-bold">Linear Time</div>
        <nav>
          {/* Navigation links */}
        </nav>
        <div className="absolute bottom-4 left-4 space-y-2">
          <div className="text-sm text-zinc-400">{user?.email}</div>
          <button
            onClick={logout}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
