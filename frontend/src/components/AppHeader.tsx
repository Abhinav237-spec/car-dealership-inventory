import { Button } from './Button'
import { Wordmark } from './Wordmark'

interface AppHeaderProps {
  email: string
  onSignOut: () => void
}

/** Top bar: brand on the left, who you are and Sign out on the right. */
export function AppHeader({ email, onSignOut }: AppHeaderProps) {
  return (
    <header className="border-b border-line bg-showroom">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Wordmark />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">{email}</span>
          <Button variant="secondary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
