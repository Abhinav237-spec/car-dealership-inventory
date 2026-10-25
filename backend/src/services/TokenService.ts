import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../domain/errors';
import { AuthUser, Role } from '../domain/types';

/** Issues and checks the access tokens that protect the API. */
export interface TokenService {
  sign(user: AuthUser): string;
  /** Throws UnauthorizedError when the token is invalid or expired. */
  verify(token: string): AuthUser;
}

const ROLES: readonly Role[] = ['user', 'admin'];

/**
 * JWT implementation. The token is stateless: the user id lives in the
 * standard `sub` claim and the role in a custom claim, so the API can
 * authorise a request without a database lookup.
 */
export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds = 3600,
  ) {}

  sign(user: AuthUser): string {
    return jwt.sign({ role: user.role }, this.secret, {
      subject: user.id,
      expiresIn: this.expiresInSeconds,
    });
  }

  verify(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, this.secret);
      if (typeof payload === 'string' || !payload.sub || !ROLES.includes(payload.role)) {
        throw new Error('Unexpected token payload');
      }
      return { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
