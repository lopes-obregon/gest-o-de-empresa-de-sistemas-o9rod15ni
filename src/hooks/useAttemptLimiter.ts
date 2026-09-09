// hooks/useAttemptLimiter.ts
import { useState, useEffect, useCallback } from 'react'
import { attemptLimiter } from '@/services/attemptLimiter'

export function useAttemptLimiter() {
  const [status, setStatus] = useState(attemptLimiter.getStatus())

  useEffect(() => {
    if (!status.isLocked) return
    const interval = setInterval(() => {
      setStatus(attemptLimiter.getStatus())
    }, 1000)
    return () => clearInterval(interval)
  }, [status.isLocked])

  const registerAttempt = useCallback(() => {
    setStatus(attemptLimiter.registerFailedAttempt())
  }, [])

  return { ...status, registerAttempt }
}