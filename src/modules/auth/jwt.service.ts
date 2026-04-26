import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import { AuthenticationAppError } from '../../common/errors/http-errors';
import type { UserRole } from '../users/user.repository';

export interface AccessTokenPayload {
  readonly email: string;
  readonly role: UserRole;
  readonly type: 'access';
  readonly userId: string;
}

export interface RefreshTokenPayload {
  readonly email: string;
  readonly jti: string;
  readonly role: UserRole;
  readonly type: 'refresh';
  readonly userId: string;
}

export interface IssuedTokenPair {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: Date;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
  readonly refreshTokenHash: string;
}

type DecodedJwtPayload = jwt.JwtPayload & {
  readonly email?: unknown;
  readonly jti?: unknown;
  readonly role?: unknown;
  readonly type?: unknown;
};

export class JwtService {
  public issueTokenPair(input: {
    readonly email: string;
    readonly role: UserRole;
    readonly userId: string;
  }): IssuedTokenPair {
    const now = new Date();
    const accessTokenExpiresAt = new Date(now.getTime() + env.JWT_ACCESS_TTL_SECONDS * 1000);
    const refreshTokenExpiresAt = new Date(now.getTime() + env.JWT_REFRESH_TTL_SECONDS * 1000);
    const refreshJti = crypto.randomUUID();
    const accessPayload: AccessTokenPayload = {
      email: input.email,
      role: input.role,
      type: 'access',
      userId: input.userId,
    };
    const refreshPayload: RefreshTokenPayload = {
      ...accessPayload,
      jti: refreshJti,
      type: 'refresh',
    };
    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
      subject: input.userId,
    });
    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_TTL_SECONDS,
      subject: input.userId,
    });

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      refreshTokenHash: this.hashToken(refreshToken),
    };
  }

  public verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.verifyToken(token, env.JWT_ACCESS_SECRET);

    if (payload.type !== 'access') {
      throw new AuthenticationAppError('Invalid access token.');
    }

    return this.toAccessPayload(payload);
  }

  public verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = this.verifyToken(token, env.JWT_REFRESH_SECRET);

    if (payload.type !== 'refresh') {
      throw new AuthenticationAppError('Invalid refresh token.');
    }

    return this.toRefreshPayload(payload);
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private verifyToken(token: string, secret: string): DecodedJwtPayload {
    try {
      const decoded = jwt.verify(token, secret);

      if (typeof decoded === 'string') {
        throw new AuthenticationAppError('Invalid token payload.');
      }

      return decoded;
    } catch (error) {
      if (error instanceof AuthenticationAppError) {
        throw error;
      }

      throw new AuthenticationAppError('Invalid or expired token.');
    }
  }

  private toAccessPayload(payload: DecodedJwtPayload): AccessTokenPayload {
    if (
      typeof payload.email !== 'string' ||
      !isUserRole(payload.role) ||
      typeof payload.sub !== 'string'
    ) {
      throw new AuthenticationAppError('Invalid access token payload.');
    }

    return {
      email: payload.email,
      role: payload.role,
      type: 'access',
      userId: payload.sub,
    };
  }

  private toRefreshPayload(payload: DecodedJwtPayload): RefreshTokenPayload {
    const accessPayload = this.toAccessPayload({ ...payload, type: 'access' });

    if (typeof payload.jti !== 'string') {
      throw new AuthenticationAppError('Invalid refresh token payload.');
    }

    return {
      ...accessPayload,
      jti: payload.jti,
      type: 'refresh',
    };
  }
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'user';
}

export const jwtService = new JwtService();
