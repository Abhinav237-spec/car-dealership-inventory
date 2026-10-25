import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App routing', () => {
  it('shows a friendly page, not a blank screen, for an unknown URL', () => {
    render(
      <MemoryRouter initialEntries={['/some/missing/page']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to the lot/i })).toHaveAttribute('href', '/')
  })

  it('still sends signed-out visitors from the dashboard to sign in', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })
})
