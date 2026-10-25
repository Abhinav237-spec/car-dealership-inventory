import { randomUUID } from 'node:crypto';
import { ConflictError } from '../../src/domain/errors';
import { NewUser, User } from '../../src/domain/types';
import { UserRepository } from '../../src/repositories/UserRepository';

/**
 * Test double for the real Postgres repository.
 *
 * Fast, no I/O, and it must behave exactly like the real one: the shared
 * "contract" tests (userRepository.contract.ts) run against both.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  async create(data: NewUser): Promise<User> {
    if (this.users.some((u) => u.email === data.email)) {
      throw new ConflictError('Email is already registered');
    }
    const user: User = { id: randomUUID(), createdAt: new Date(), ...data };
    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
}
