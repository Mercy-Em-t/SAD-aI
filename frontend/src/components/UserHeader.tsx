'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '../lib/api'
import { getAuthToken } from '../lib/auth'

export default function UserHeader() {
  const [user, setUser] = useState<{ email: string; role: string; balance: number } | null>(null)
  const token = typeof window !== 'undefined' ? getAuthToken() : null

  useEffect(() => {
    if (token) {
      apiClient.get('/api/auth/me').then(res => {
        setUser(res.data.user)
      }).catch(() => {
        setUser(null)
      })
    }
  }, [token])

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Balance</span>
        <span className="text-sm font-mono font-bold text-sky-400">{user.balance} tokens</span>
      </div>
      
      {user.role === 'admin' && (
        <Link 
          href="/admin" 
          className="bg-violet-600/20 text-violet-400 border border-violet-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-600/30 transition-all shadow-lg shadow-violet-900/20"
        >
          🛡️ Admin
        </Link>
      )}
    </div>
  )
}
