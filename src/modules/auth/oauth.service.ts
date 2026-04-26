import crypto from 'node:crypto';

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { ExternalAuthProviderError } from '../../common/errors/http-errors';
import { env } from '../../config/env';

interface GoogleIdentity {
  readonly avatarUrl?: string;
  readonly displayName?: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly providerUserId: string;
}

interface AppleIdentity {
  readonly email?: string;
  readonly emailVerified: boolean;
  readonly subject: string;
}

type AppleJsonWebKey = JsonWebKey & {
  readonly kid?: string;
};

interface AppleJwksResponse {
  readonly keys: AppleJsonWebKey[];
}

type AppleJwtPayload = jwt.JwtPayload & {
  readonly email?: unknown;
  readonly email_verified?: unknown;
  readonly sub?: unknown;
};

export class OAuthService {
  private readonly googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);
  private appleKeysCache?: {
    readonly expiresAt: number;
    readonly keys: AppleJsonWebKey[];
  };

  public async verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new ExternalAuthProviderError('google', 'Google login is not configured.');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        audience: env.GOOGLE_CLIENT_ID,
        idToken,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new ExternalAuthProviderError('google', 'Google identity token is missing required claims.');
      }

      return {
        email: payload.email.toLowerCase(),
        emailVerified: payload.email_verified === true,
        providerUserId: payload.sub,
        ...(payload.name ? { displayName: payload.name } : {}),
        ...(payload.picture ? { avatarUrl: payload.picture } : {}),
      };
    } catch (error) {
      if (error instanceof ExternalAuthProviderError) {
        throw error;
      }

      throw new ExternalAuthProviderError('google');
    }
  }

  public async verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentity> {
    if (!env.APPLE_CLIENT_ID) {
      throw new ExternalAuthProviderError('apple', 'Apple login is not configured.');
    }

    const decoded = jwt.decode(identityToken, { complete: true });

    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      throw new ExternalAuthProviderError('apple', 'Apple identity token header is invalid.');
    }

    const publicKey = await this.getApplePublicKey(decoded.header.kid);

    try {
      const payload = jwt.verify(identityToken, publicKey, {
        algorithms: ['RS256'],
        audience: env.APPLE_CLIENT_ID,
        issuer: 'https://appleid.apple.com',
      }) as AppleJwtPayload;

      if (typeof payload.sub !== 'string') {
        throw new ExternalAuthProviderError('apple', 'Apple identity token is missing subject.');
      }

      const identity: AppleIdentity = {
        subject: payload.sub,
        emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      };

      return typeof payload.email === 'string'
        ? { ...identity, email: payload.email.toLowerCase() }
        : identity;
    } catch (error) {
      if (error instanceof ExternalAuthProviderError) {
        throw error;
      }

      throw new ExternalAuthProviderError('apple');
    }
  }

  private async getApplePublicKey(kid: string): Promise<string> {
    const keys = await this.getAppleKeys();
    const jwk = keys.find((key) => key.kid === kid);

    if (!jwk) {
      throw new ExternalAuthProviderError('apple', 'Apple public key was not found for token.');
    }

    return crypto.createPublicKey({ format: 'jwk', key: jwk }).export({
      format: 'pem',
      type: 'spki',
    });
  }

  private async getAppleKeys(): Promise<AppleJsonWebKey[]> {
    if (this.appleKeysCache && this.appleKeysCache.expiresAt > Date.now()) {
      return this.appleKeysCache.keys;
    }

    const response = await fetch('https://appleid.apple.com/auth/keys');

    if (!response.ok) {
      throw new ExternalAuthProviderError('apple', 'Unable to fetch Apple public keys.');
    }

    const payload = (await response.json()) as AppleJwksResponse;
    this.appleKeysCache = {
      expiresAt: Date.now() + 60 * 60 * 1000,
      keys: payload.keys,
    };

    return payload.keys;
  }
}

export const oauthService = new OAuthService();
