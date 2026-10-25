import type { Session } from '../api/types'

const STORAGE_KEY = 'lotline.session'

/**
 * The session lives in localStorage so a page refresh keeps you signed in.
 * (Trade-off: any script on the page can read it, which is why the app avoids
 * injecting raw HTML. Short token lifetimes limit the damage of a leak.)
 */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    // Guard against stale or hand-edited data: only trust the expected shape.
    return typeof session?.token === 'string' && typeof session.user?.email === 'string' ? session : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
