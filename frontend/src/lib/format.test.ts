import { formatPrice } from './format'

describe('formatPrice', () => {
  it('formats whole dollar amounts without cents', () => {
    expect(formatPrice(28500)).toBe('$28,500')
  })

  it('shows cents only when the price has them', () => {
    expect(formatPrice(28500.5)).toBe('$28,500.50')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0')
  })
})
