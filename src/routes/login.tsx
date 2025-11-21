import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../utils/firebase'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading) {
      navigate({ to: '/' })
    }
  }, [user, loading, navigate])

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Login failed', error)
      alert('Login failed. Please try again.')
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold">Linear Time Tracking</h1>
        <p className="mb-8 text-center text-zinc-400">
          Sign in to track time on your Linear issues.
          <br />
          <span className="text-xs text-zinc-500">(Restricted to @hypercash.com.br)</span>
        </p>
        <button
          onClick={handleLogin}
          className="w-full rounded-md bg-zinc-50 px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
