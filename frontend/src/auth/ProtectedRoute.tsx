import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Route guard. Wrap pages in <Route element={<ProtectedRoute />}>:
 * signed-out visitors go to /login (remembering where they were heading),
 * and with `requireAdmin`, regular users are sent back to the dashboard.
 *
 * This only improves the experience. The real security check is on the
 * server, which re-verifies the token and role on every request.
 */
export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { user, isAdmin } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
