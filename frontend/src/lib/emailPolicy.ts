/**
 * Sign-up rule, mirrored from the backend (backend/src/validation/emailPolicy.ts):
 * no two A's in a row, in any case. The browser check only gives instant feedback;
 * the server still enforces the rule.
 */
export const CONSECUTIVE_A_MESSAGE = 'Email must not contain consecutive letter a (A or a).'

export function hasConsecutiveAs(email: string): boolean {
  return /a{2}/i.test(email)
}
