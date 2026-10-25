import { loadSession } from '../auth/storage'

/** Prefix for API calls. Empty in dev (Vite proxies /api); set VITE_API_URL when deployed. */
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** A failed API call. `status` is 0 when the server could not be reached at all. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
}

/**
 * The single doorway to the backend. It adds the JSON headers and the Bearer
 * token, and turns every failure into an ApiError with a message that is safe
 * to show to a person.
 */
export async function request<T = unknown>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const token = loadSession()?.token
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    // A 401 on a request that carried a token means the session expired. Tell
    // the auth layer so it can sign the user out (see AuthProvider).
    if (response.status === 401 && token) window.dispatchEvent(new Event('auth:unauthorized'))
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** The backend replies with { error: "message" }; fall back to the status code. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body?.error === 'string') return body.error
  } catch {
    // Not JSON (for example a proxy error page): use the generic message below.
  }
  return `Request failed (${response.status})`
}
