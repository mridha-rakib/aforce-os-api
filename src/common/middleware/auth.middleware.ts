import type { RequestHandler } from 'express';

import {
  AuthenticationAppError,
  AuthorizationAppError,
} from '../errors/http-errors';
import { jwtService } from '../../modules/auth/jwt.service';
import type { UserRole } from '../../modules/users/user.repository';

export const authenticate: RequestHandler = (request, _response, next) => {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AuthenticationAppError('Missing bearer access token.');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const payload = jwtService.verifyAccessToken(token);

    request.user = {
      email: payload.email,
      role: payload.role,
      userId: payload.userId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) {
      next(new AuthenticationAppError('Authentication is required.'));
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(new AuthorizationAppError('Your account role cannot access this resource.', {
        requiredRoles: roles,
        role: request.user.role,
      }));
      return;
    }

    next();
  };
}
