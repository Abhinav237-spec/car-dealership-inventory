import { z } from 'zod';

/** Emails are trimmed and lower-cased so "Ada@x.com" and "ada@x.com" are one account. */
const email = z.string().trim().toLowerCase().pipe(z.email({ error: 'must be a valid email address' }));

export const registerSchema = z.object({
  email,
  password: z.string().min(8, 'must be at least 8 characters').max(72, 'must be at most 72 characters'),
});

const requiredText = z.string().trim().min(1, 'is required');

export const vehicleInputSchema = z.object({
  make: requiredText,
  model: requiredText,
  category: requiredText,
  price: z.number().min(0, 'must be 0 or more'),
  quantity: z.number().int('must be a whole number').min(0, 'must be 0 or more'),
});

/** PUT accepts any subset of the fields, but not an empty update. */
export const vehicleUpdateSchema = vehicleInputSchema
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, 'Provide at least one field to update');

export const restockSchema = z.object({
  quantity: z.number().int('must be a whole number').min(1, 'must be at least 1'),
});

/** Query strings arrive as text, and an empty value (`?make=`) means "no filter". */
const blankToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());
const optionalPrice = z.preprocess(blankToUndefined, z.coerce.number().min(0, 'must be 0 or more').optional());

export const vehicleSearchSchema = z
  .object({
    make: optionalText,
    model: optionalText,
    category: optionalText,
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
  })
  .refine(
    ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    'minPrice must not be greater than maxPrice',
  );

/** Login only checks presence; the real check is the credential comparison. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'is required'),
  password: z.string().min(1, 'is required'),
});
