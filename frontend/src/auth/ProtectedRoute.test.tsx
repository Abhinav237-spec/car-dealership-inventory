import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { makeSession } from '../test/fixtures'
import { AuthProvider } from './AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { saveSession } from './storage'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Login screen</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Dashboard</p>} />
          </Route>
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<p>Admin only</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('sends a signed-out visitor to the login page', () => {
    renderAt('/')

    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('shows the page to a signed-in user', () => {
    saveSession(makeSession('user'))

    renderAt('/')

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('keeps regular users out of admin-only pages', () => {
    saveSession(makeSession('user'))

    renderAt('/admin')

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Admin only')).not.toBeInTheDocument()
  })

  it('lets admins into admin-only pages', () => {
    saveSession(makeSession('admin'))

    renderAt('/admin')

    expect(screen.getByText('Admin only')).toBeInTheDocument()
  })
})
