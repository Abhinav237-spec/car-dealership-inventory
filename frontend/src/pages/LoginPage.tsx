import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Where to go after signing in: the page the visitor was originally heading to.
  const destination = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
  if (user) return <Navigate to={destination} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      // On success the signed-in user appears in context and the redirect above takes over.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Sign in">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p role="alert" className="border-l-4 border-signal bg-white px-3 py-2 text-sm text-signal">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-racing underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
