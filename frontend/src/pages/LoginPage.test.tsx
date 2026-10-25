import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApiError } from '../api/client'
import * as authApi from '../api/auth'
import { AuthProvider } from '../auth/AuthContext'
import { saveSession } from '../auth/storage'
import { makeSession } from '../test/fixtures'
import { LoginPage } from './LoginPage'

vi.mock('../api/auth')

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<p>Register screen</p>} />
          <Route path="/" element={<p>Home screen</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email = 'ada@example.com', password = 'Passw0rd!') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^email$/i), email)
  await user.type(screen.getByLabelText(/^password$/i), password)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('LoginPage', () => {
  it('signs in with the typed credentials and opens the dashboard', async () => {
    vi.mocked(authApi.login).mockResolvedValue(makeSession())
    renderLogin()

    await fillAndSubmit()

    expect(authApi.login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'Passw0rd!' })
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('shows the server message when sign-in fails', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    renderLogin()

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(screen.queryByText('Home screen')).not.toBeInTheDocument()
  })

  it('disables the button while the request is in flight', async () => {
    let finish: (value: ReturnType<typeof makeSession>) => void = () => undefined
    vi.mocked(authApi.login).mockReturnValue(new Promise((resolve) => (finish = resolve)))
    renderLogin()

    await fillAndSubmit()

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    finish(makeSession())
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('links to the registration page', async () => {
    renderLogin()

    await userEvent.setup().click(screen.getByRole('link', { name: /create an account/i }))

    expect(screen.getByText('Register screen')).toBeInTheDocument()
  })

  it('sends an already signed-in visitor straight to the dashboard', () => {
    saveSession(makeSession())

    renderLogin()

    expect(screen.getByText('Home screen')).toBeInTheDocument()
  })
})
