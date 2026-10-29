import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApiError } from '../api/client'
import * as authApi from '../api/auth'
import { AuthProvider } from '../auth/AuthContext'
import { makeSession } from '../test/fixtures'
import { RegisterPage } from './RegisterPage'

vi.mock('../api/auth')

function renderRegister() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>Login screen</p>} />
          <Route path="/" element={<p>Home screen</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^email$/i), email)
  await user.type(screen.getByLabelText(/^password$/i), password)
  await user.click(screen.getByRole('button', { name: /create account/i }))
}

describe('RegisterPage', () => {
  it('creates the account and opens the dashboard', async () => {
    vi.mocked(authApi.register).mockResolvedValue(makeSession())
    renderRegister()

    await fillAndSubmit('ada@example.com', 'Passw0rd!')

    expect(authApi.register).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'Passw0rd!' })
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it.each(['aaron@example.com', 'BAAn@example.com', 'maAx@example.com'])(
    'blocks %s in the browser, with a clear message and no API call',
    async (email) => {
      renderRegister()

      await fillAndSubmit(email, 'Passw0rd!')

      expect(await screen.findByRole('alert')).toHaveTextContent(/consecutive/i)
      expect(authApi.register).not.toHaveBeenCalled()
    },
  )

  it('lets an email with single, separated a letters through', async () => {
    vi.mocked(authApi.register).mockResolvedValue(makeSession())
    renderRegister()

    await fillAndSubmit('ada@example.com', 'Passw0rd!')

    expect(authApi.register).toHaveBeenCalled()
  })

  it('explains a too-short password without calling the API', async () => {
    renderRegister()

    await fillAndSubmit('ada@example.com', 'short')

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8 characters/i)
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('shows the server message when the email is already registered', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new ApiError(409, 'Email is already registered'))
    renderRegister()

    await fillAndSubmit('ada@example.com', 'Passw0rd!')

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered')
  })

  it('links back to sign in', async () => {
    renderRegister()

    await userEvent.setup().click(screen.getByRole('link', { name: /sign in/i }))

    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })
})
