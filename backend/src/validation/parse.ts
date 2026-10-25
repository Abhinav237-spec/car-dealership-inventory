import { z } from 'zod';
import { ValidationError } from '../domain/errors';

/**
 * Validates untrusted input (request body or query) against a zod schema.
 * Returns the cleaned, typed value or throws a 400 ValidationError that
 * names the first offending field.
 */
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const issue = result.error.issues[0];
  const field = issue.path.join('.');
  throw new ValidationError(field ? `${field}: ${issue.message}` : issue.message);
}
