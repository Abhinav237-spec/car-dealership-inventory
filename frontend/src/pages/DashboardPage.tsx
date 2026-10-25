import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'

/** Temporary landing page: the real inventory dashboard arrives in the next commits. */
export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="display text-4xl">Inventory</h1>
      <p className="mt-2 text-muted">Signed in as {user?.email}</p>
      <Button className="mt-6" variant="secondary" onClick={logout}>
        Sign out
      </Button>
    </main>
  )
}
