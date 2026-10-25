import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as authApi from '../api/auth'
import { makeSession } from '../test/fixtures'
import { AuthProvider, useAuth } from './AuthContext'
import { loadSession, saveSession } from './storage'

vi.mock('../api/auth')

/** Tiny consumer that exposes what the context provides. */
function Probe() {
  const { user, isAdmin, login, logout } = useAuth()
  return (
    <div>
      <p>user: {user?.email ?? 'nobody'}</p>
      <p>admin: {String(isAdmin)}</p>
      <button onClick={() => login({ email: 'user@example.com', password: 'Passw0rd!' })}>log in</button>
      <button onClick={logout}>log out</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

describe('AuthProvider', () => {
  it('starts signed out when nothing is stored', () => {
    renderProbe()

    expect(screen.getByText('user: nobody')).toBeInTheDocument()
    expect(screen.getByText('admin: false')).toBeInTheDocument()
  })

  it('restores a stored session on load', () => {
    saveSession(makeSession('admin'))

    renderProbe()

    expect(screen.getByText('user: admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('admin: true')).toBeInTheDocument()
  })

  it('signs in, exposes the user and persists the session', async () => {
    vi.mocked(authApi.login).mockResolvedValue(makeSession('user'))
    renderProbe()

    await userEvent.setup().click(screen.getByText('log in'))

    expect(await screen.findByText('user: user@example.com')).toBeInTheDocument()
    expect(loadSession()?.token).toBe('token-for-user')
  })

  it('signs out and clears the stored session', async () => {
    saveSession(makeSession())
    renderProbe()

    await userEvent.setup().click(screen.getByText('log out'))

    expect(screen.getByText('user: nobody')).toBeInTheDocument()
    expect(loadSession()).toBeNull()
  })

  it('signs out when the API reports an expired token', () => {
    saveSession(makeSession())
    renderProbe()

    act(() => {
      window.dispatchEvent(new Event('auth:unauthorized'))
    })

    expect(screen.getByText('user: nobody')).toBeInTheDocument()
    expect(loadSession()).toBeNull()
  })

  it('ignores a corrupted stored session', () => {
    localStorage.setItem('lotline.session', '{not json')

    renderProbe()

    expect(screen.getByText('user: nobody')).toBeInTheDocument()
  })
})
