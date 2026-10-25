import { render } from '@testing-library/react'
import { ShowroomBackdrop } from './ShowroomBackdrop'

describe('ShowroomBackdrop', () => {
  it('is purely decorative: hidden from assistive technology and not clickable', () => {
    const { container } = render(<ShowroomBackdrop />)
    const backdrop = container.firstElementChild!

    expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    expect(backdrop.className).toContain('pointer-events-none')
  })

  it('draws a car and a road', () => {
    const { container } = render(<ShowroomBackdrop />)

    expect(container.querySelector('[data-part="car"]')).not.toBeNull()
    expect(container.querySelector('[data-part="road"]')).not.toBeNull()
  })
})
