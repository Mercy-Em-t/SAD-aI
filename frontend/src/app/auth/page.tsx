'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '../../lib/api'
import { setAuthSession } from '../../lib/auth'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await apiClient.post(path, { email, password })
      setAuthSession(res.data.token, res.data.user)
      router.push('/projects')
    } catch (err: unknown) {
      setError('Authentication failed. Check credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Secure Access</h1>
        <p className="text-slate-500 text-sm mb-6">Sign in to access only your projects and outputs.</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input id="email" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input id="password" aria-label="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={8} required className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <button disabled={loading} className="w-full bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-500 disabled:opacity-60">
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 text-sm text-sky-700 hover:text-sky-600"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  )
}
