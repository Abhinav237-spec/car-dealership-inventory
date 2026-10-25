import { RequestHandler } from 'express';
import { ForbiddenError } from '../domain/errors';
import { Role } from '../domain/types';
import { AuthenticatedRequest } from './authenticate';

/** Use after `authenticate`: only callers with the given role get through (else 403). */
export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if ((req as AuthenticatedRequest).user?.role !== role) {
      throw new ForbiddenError(`Requires ${role} access`);
    }
    next();
  };
}
