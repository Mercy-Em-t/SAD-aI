'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken, getAuthUser } from '../lib/auth'

export default function AuthGate() {
  const router = useRouter()

  useEffect(() => {
    const hasSession = !!getAuthToken() || !!getAuthUser()
    if (!hasSession) {
      router.replace('/auth')
    }
  }, [router])

  return null
}
