import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Wordmark'

/** Shown for any URL the app does not know, instead of a blank screen. */
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <Wordmark />
      <h1 className="display text-4xl sm:text-5xl">Page not found</h1>
      <p className="text-muted">That address is not on the lot. Check the link, or head back to the inventory.</p>
      <Link to="/" className="w-fit font-semibold text-racing underline underline-offset-4">
        Back to the lot
      </Link>
    </main>
  )
}
