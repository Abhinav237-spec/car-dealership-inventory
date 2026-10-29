import { hasConsecutiveAs } from '../src/validation/emailPolicy';

describe('hasConsecutiveAs', () => {
  it.each(['aa', 'AA', 'aA', 'Aa', 'xaay', 'baaad@x.com', 'me@saas.com'])('is true for %s', (value) => {
    expect(hasConsecutiveAs(value)).toBe(true);
  });

  it.each(['', 'a', 'A', 'ada@x.com', 'a.a@x.com', 'a_a', 'bob@example.com'])('is false for %s', (value) => {
    expect(hasConsecutiveAs(value)).toBe(false);
  });
});
