/**
 * Business rule for sign-ups: an email may not contain two or more A's in a
 * row, in any case ("aa", "AA", "aA", "Aa"). Kept here, away from the generic
 * schema code, so the rule has one name, one place to change and its own tests.
 */
export const CONSECUTIVE_A_MESSAGE = 'must not contain consecutive letter a (A or a)';

const CONSECUTIVE_A = /a{2}/i;

export function hasConsecutiveAs(email: string): boolean {
  return CONSECUTIVE_A.test(email);
}
