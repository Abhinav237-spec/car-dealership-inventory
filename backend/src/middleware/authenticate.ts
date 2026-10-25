import { Request, RequestHandler } from 'express';
import { UnauthorizedError } from '../domain/errors';
import { AuthUser } from '../domain/types';
import { TokenService } from '../services/TokenService';

/** A request that has passed `authenticate`, so `user` is guaranteed. */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/**
 * Guards a route: requires "Authorization: Bearer <jwt>", verifies it and
 * attaches the caller to the request. Failures become 401 via errorHandler.
 */
export function authenticate(tokens: TokenService): RequestHandler {
  return (req, _res, next) => {
    const [scheme, token] = req.header('Authorization')?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Missing or malformed access token');
    }
    (req as AuthenticatedRequest).user = tokens.verify(token);
    next();
  };
}
