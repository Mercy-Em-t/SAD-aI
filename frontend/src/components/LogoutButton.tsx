'use client'

import { useRouter } from 'next/navigation'
import { apiClient } from '../lib/api'
import { clearAuthSession } from '../lib/auth'

export default function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout')
    } catch {
      // best-effort logout
    } finally {
      clearAuthSession()
      router.replace('/auth')
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="hover:text-white transition-colors"
    >
      Logout
    </button>
  )
}
