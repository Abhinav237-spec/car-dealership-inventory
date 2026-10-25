import { z } from 'zod';

/** Emails are trimmed and lower-cased so "Ada@x.com" and "ada@x.com" are one account. */
const email = z.string().trim().toLowerCase().pipe(z.email({ error: 'must be a valid email address' }));

export const registerSchema = z.object({
  email,
  password: z.string().min(8, 'must be at least 8 characters').max(72, 'must be at most 72 characters'),
});

/** Login only checks presence; the real check is the credential comparison. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'is required'),
  password: z.string().min(1, 'is required'),
});
