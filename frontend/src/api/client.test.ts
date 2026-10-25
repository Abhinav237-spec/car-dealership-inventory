import { saveSession } from '../auth/storage'
import { makeSession } from '../test/fixtures'
import { ApiError, request } from './client'

const fetchMock = vi.fn()

/** Builds the minimal Response-like object our client reads. */
function respond(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new Error('no body')
      return body
    },
  }
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('sends a JSON body with the right headers and returns the parsed response', async () => {
    fetchMock.mockResolvedValue(respond(201, { id: 'v1' }))

    const result = await request('/api/vehicles', { method: 'POST', body: { make: 'Ford' } })

    expect(result).toEqual({ id: 'v1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/vehicles')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ make: 'Ford' }))
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('attaches the stored token as a Bearer header', async () => {
    saveSession(makeSession('admin'))
    fetchMock.mockResolvedValue(respond(200, []))

    await request('/api/vehicles')

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer token-for-admin')
  })

  it('sends no Authorization header when signed out', async () => {
    fetchMock.mockResolvedValue(respond(200, []))

    await request('/api/vehicles')

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(respond(204))

    await expect(request('/api/vehicles/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying the server message and status', async () => {
    fetchMock.mockResolvedValue(respond(409, { error: 'Vehicle is out of stock' }))

    await expect(request('/api/vehicles/1/purchase', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Vehicle is out of stock',
    })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(respond(502))

    await expect(request('/api/vehicles')).rejects.toThrow('Request failed (502)')
  })

  it('reports an unreachable server as an ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await request('/api/vehicles').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/reach the server/i)
  })

  it('announces an expired session when a request that carried a token gets 401', async () => {
    saveSession(makeSession())
    const listener = vi.fn()
    window.addEventListener('auth:unauthorized', listener)
    fetchMock.mockResolvedValue(respond(401, { error: 'Invalid or expired token' }))

    await request('/api/vehicles').catch(() => undefined)

    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('auth:unauthorized', listener)
  })

  it('does not announce an expired session for a failed sign-in (no token was sent)', async () => {
    const listener = vi.fn()
    window.addEventListener('auth:unauthorized', listener)
    fetchMock.mockResolvedValue(respond(401, { error: 'Invalid email or password' }))

    await request('/api/auth/login', { method: 'POST', body: {} }).catch(() => undefined)

    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener('auth:unauthorized', listener)
  })
})
