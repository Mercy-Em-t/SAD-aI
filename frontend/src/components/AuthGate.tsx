'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from '../lib/auth'

export default function AuthGate() {
  const router = useRouter()

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/auth')
    }
  }, [router])

  return null
}
