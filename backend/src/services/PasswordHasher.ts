import { compare, hash } from 'bcryptjs';

/** Abstraction over password hashing so the algorithm can be swapped or faked. */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

/** bcrypt with a tunable cost: higher is slower and harder to brute-force. */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost = 10) {}

  hash(plain: string): Promise<string> {
    return hash(plain, this.cost);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
