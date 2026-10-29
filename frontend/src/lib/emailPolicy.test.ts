import { hasConsecutiveAs } from './emailPolicy'

describe('hasConsecutiveAs', () => {
  it.each(['aa', 'AA', 'aA', 'Aa', 'baaad@x.com', 'me@saas.com'])('is true for %s', (value) => {
    expect(hasConsecutiveAs(value)).toBe(true)
  })

  it.each(['', 'a', 'ada@x.com', 'a.a@x.com', 'bob@example.com'])('is false for %s', (value) => {
    expect(hasConsecutiveAs(value)).toBe(false)
  })
})
