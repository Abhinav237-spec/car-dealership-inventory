import { ConflictError, UnauthorizedError } from '../domain/errors';
import { PublicUser, User } from '../domain/types';
import { UserRepository } from '../repositories/UserRepository';
import { PasswordHasher } from './PasswordHasher';
import { TokenService } from './TokenService';

export interface Credentials {
  email: string;
  password: string;
}

/** What register/login hand back: a token plus the safe view of the user. */
export interface Session {
  token: string;
  user: PublicUser;
}

/**
 * Business rules for accounts. It knows nothing about HTTP: input arrives
 * already validated, and failures are thrown as domain errors.
 */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  /** Public sign-up always creates a regular user; admins are seeded. */
  async register({ email, password }: Credentials): Promise<Session> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictError('Email is already registered');
    }
    const user = await this.users.create({
      email,
      passwordHash: await this.hasher.hash(password),
      role: 'user',
    });
    return this.startSession(user);
  }

  async login({ email, password }: Credentials): Promise<Session> {
    const user = await this.users.findByEmail(email);
    const passwordMatches = user && (await this.hasher.compare(password, user.passwordHash));
    if (!user || !passwordMatches) {
      // One message for both cases so attackers cannot discover which emails exist.
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.startSession(user);
  }

  private startSession(user: User): Session {
    return {
      token: this.tokens.sign({ id: user.id, role: user.role }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
