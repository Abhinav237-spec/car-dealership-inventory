import type { ReactNode } from 'react'
import { Wordmark } from './Wordmark'

/** Shared frame for the sign-in and sign-up pages: brand panel on the left, form on the right. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="flex flex-col justify-between gap-12 bg-racing px-6 py-8 text-showroom sm:px-12 sm:py-12">
        <Wordmark tone="light" />
        <div className="max-w-xl">
          <p className="display text-4xl sm:text-6xl">The whole lot, one search away.</p>
          <p className="mt-6 max-w-md text-lg text-showroom/85">
            See what is on the lot, check stock at a glance and buy in one click.
          </p>
        </div>
        <span className="price-tag w-fit text-sm">Live stock counts</span>
      </aside>

      <main className="flex items-center bg-showroom px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="display mb-8 text-3xl">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  )
}
