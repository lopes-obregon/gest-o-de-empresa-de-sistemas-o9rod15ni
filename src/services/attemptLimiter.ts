// services/attemptLimiter.ts
const MAX_ATTEMPTS = 3
const LOCK_DURATION_MS = 60_000
const STORAGE_KEY = 'login_attempt_lock'

interface LockState {
  attempts: number
  lockedUntil: number | null
}

function readState(): LockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: null }
  } catch {
    return { attempts: 0, lockedUntil: null }
  }
}

function writeState(state: LockState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const attemptLimiter = {
  getStatus(): { isLocked: boolean; secondsLeft: number } {
    const state = readState()
    if (state.lockedUntil && state.lockedUntil > Date.now()) {
      return {
        isLocked: true,
        secondsLeft: Math.ceil((state.lockedUntil - Date.now()) / 1000),
      }
    }
    // lock expirou -> reseta
    if (state.lockedUntil) writeState({ attempts: 0, lockedUntil: null })
    return { isLocked: false, secondsLeft: 0 }
  },

  registerFailedAttempt(): { isLocked: boolean; secondsLeft: number } {
    const state = readState()
    const attempts = state.attempts + 1
    console.log("Tentativa:", attempts);
    if (attempts >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCK_DURATION_MS
      writeState({ attempts, lockedUntil })
      return { isLocked: true, secondsLeft: LOCK_DURATION_MS / 1000 }
    }

    writeState({ attempts, lockedUntil: null })
    return { isLocked: false, secondsLeft: 0 }
  },

  reset() {
    writeState({ attempts: 0, lockedUntil: null })
  },
}