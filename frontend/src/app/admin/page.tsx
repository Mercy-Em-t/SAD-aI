'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '../../lib/api'
import AuthGate from '../../components/AuthGate'

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  balance: number
  createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/api/admin/users')
      setUsers(res.data.users)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateBalance = async (userId: string, delta: number) => {
    try {
      await apiClient.post(`/api/admin/users/${userId}/balance`, { delta })
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Update failed')
    }
  }

  const toggleRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      await apiClient.patch(`/api/admin/users/${userId}/role`, { role: newRole })
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Role update failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <AuthGate />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Manage users, token balances, and system access.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">{user.email}</div>
                  <div className="text-xs text-slate-400">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-mono font-bold text-slate-700">{user.balance} tokens</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateBalance(user.id, 10)}
                      className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-1 rounded border border-sky-200 transition-colors"
                    >
                      +10
                    </button>
                    <button 
                      onClick={() => updateBalance(user.id, -10)}
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-colors"
                    >
                      -10
                    </button>
                    <button 
                      onClick={() => toggleRole(user.id, user.role)}
                      className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1 rounded border border-violet-200 transition-colors"
                    >
                      Toggle Role
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  Loading users...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
