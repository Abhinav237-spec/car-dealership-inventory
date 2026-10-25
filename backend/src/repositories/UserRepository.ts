import { NewUser, User } from '../domain/types';

/**
 * Storage contract for users.
 *
 * Services depend on this interface, not on Postgres (Dependency Inversion).
 * That is why tests can swap in an in-memory version.
 */
export interface UserRepository {
  /** Throws ConflictError if the email already exists. */
  create(data: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
