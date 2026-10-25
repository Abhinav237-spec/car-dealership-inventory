import { Pool } from 'pg';
import { ConflictError } from '../domain/errors';
import { NewUser, Role, User } from '../domain/types';
import { UserRepository } from './UserRepository';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
}

/** Maps a database row (snake_case) to the domain object (camelCase). */
const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  createdAt: row.created_at,
});

const UNIQUE_VIOLATION = '23505'; // PostgreSQL error code

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: NewUser): Promise<User> {
    try {
      const { rows } = await this.pool.query<UserRow>(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *`,
        [data.email, data.passwordHash, data.role],
      );
      return toUser(rows[0]);
    } catch (error) {
      // The UNIQUE constraint is the real guard against two simultaneous sign-ups.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictError('Email is already registered');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? toUser(rows[0]) : null;
  }
}
