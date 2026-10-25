import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'

const MIN_PASSWORD_LENGTH = 8 // matches the backend rule

export function RegisterPage() {
  const { user, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    // Fail fast in the browser for the rule we already know; the server still enforces it.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    setSubmitting(true)
    try {
      await register({ email, password })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create your account">
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
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p role="alert" className="border-l-4 border-signal bg-white px-3 py-2 text-sm text-signal">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-racing underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
