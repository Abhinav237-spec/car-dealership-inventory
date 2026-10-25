/** Turns anything that was thrown into a sentence that is safe to show a person. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.'
}
