import crypto from 'node:crypto';

import {
  AuthenticationAppError,
  ConflictAppError,
  DuplicateResourceError,
  ResourceNotFoundError,
} from '../../common/errors/http-errors';
import { env } from '../../config/env';
import {
  userRepository,
  type UserRecord,
  type UserRepository,
  type UserRole,
} from '../users/user.repository';
import {
  authTokenRepository,
  type AuthTokenRepository,
} from './auth-token.repository';
import { emailService, type EmailService } from './email.service';
import { jwtService, type IssuedTokenPair, type JwtService } from './jwt.service';
import { oauthService, type OAuthService } from './oauth.service';
import { passwordService, type PasswordService } from './password.service';
import type {
  AppleLoginInput,
  ForgotPasswordInput,
  GoogleLoginInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.schema';

interface PublicUser {
  readonly avatarUrl?: string;
  readonly displayName?: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly firstName?: string;
  readonly id: string;
  readonly lastName?: string;
  readonly providers: {
    readonly apple: boolean;
    readonly google: boolean;
    readonly password: boolean;
  };
  readonly role: UserRole;
}

interface AuthSession {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: Date;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
  readonly user: PublicUser;
}

interface RegistrationResult {
  readonly verificationRequired: true;
  readonly user: PublicUser;
}

export class AuthService {
  public constructor(
    private readonly users: UserRepository,
    private readonly tokens: AuthTokenRepository,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly oauth: OAuthService,
  ) {}

  public async register(input: RegisterInput): Promise<RegistrationResult> {
    return this.registerWithPassword(input, 'user');
  }

  public async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email);

    if (!user?.passwordHash) {
      throw new AuthenticationAppError('Invalid email or password.');
    }

    const passwordMatches = await this.passwords.verify(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AuthenticationAppError('Invalid email or password.');
    }

    if (!user.emailVerifiedAt) {
      throw new AuthenticationAppError('Email verification is required before login.', {
        email: user.email,
      });
    }

    return this.issueSession(user);
  }

  public async verifyEmail(input: VerifyEmailInput): Promise<AuthSession> {
    const userToVerify = await this.users.findByEmail(input.email);

    if (!userToVerify) {
      throw new AuthenticationAppError('Invalid or expired email verification code.');
    }

    const tokenHash = this.hashEmailVerificationCode(userToVerify.id, input.code);
    const verificationToken = await this.tokens.findActiveEmailVerificationTokenForUser(
      userToVerify.id,
      tokenHash,
    );

    if (!verificationToken) {
      throw new AuthenticationAppError('Invalid or expired email verification code.');
    }

    await this.tokens.markEmailVerificationTokenUsed(tokenHash);
    const user = await this.users.markEmailVerified(verificationToken.userId);

    if (!user) {
      throw new ResourceNotFoundError('user', { userId: verificationToken.userId });
    }

    return this.issueSession(user);
  }

  public async resendVerification(input: ResendVerificationInput): Promise<{ readonly sent: boolean }> {
    const user = await this.users.findByEmail(input.email);

    if (!user || user.emailVerifiedAt) {
      return { sent: true };
    }

    await this.sendVerificationEmail(user);

    return { sent: true };
  }

  public async forgotPassword(input: ForgotPasswordInput): Promise<{ readonly sent: boolean }> {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
      return { sent: true };
    }

    await this.sendPasswordResetEmail(user);

    return { sent: true };
  }

  public async resetPassword(input: ResetPasswordInput): Promise<PublicUser> {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
      throw new AuthenticationAppError('Invalid or expired password reset code.');
    }

    const tokenHash = this.hashPasswordResetCode(user.id, input.code);
    const resetToken = await this.tokens.findActivePasswordResetTokenForUser(user.id, tokenHash);

    if (!resetToken) {
      throw new AuthenticationAppError('Invalid or expired password reset code.');
    }

    const passwordHash = await this.passwords.hash(input.password);
    await this.tokens.markPasswordResetTokenUsed(tokenHash);

    const updatedUser = await this.users.updatePasswordProvider(user.id, passwordHash);

    if (!updatedUser) {
      throw new ResourceNotFoundError('user', { userId: user.id });
    }

    if (!updatedUser.emailVerifiedAt) {
      const verifiedUser = await this.users.markEmailVerified(updatedUser.id);

      if (verifiedUser) {
        return this.toPublicUser(verifiedUser);
      }
    }

    return this.toPublicUser(updatedUser);
  }

  public async refresh(input: RefreshInput): Promise<AuthSession> {
    const payload = this.jwt.verifyRefreshToken(input.refreshToken);
    const refreshTokenHash = this.jwt.hashToken(input.refreshToken);
    const storedToken = await this.tokens.findActiveRefreshToken(refreshTokenHash);

    if (!storedToken || storedToken.userId !== payload.userId) {
      throw new AuthenticationAppError('Invalid or expired refresh token.');
    }

    const user = await this.users.findById(payload.userId);

    if (!user) {
      throw new AuthenticationAppError('Invalid refresh token user.');
    }

    await this.tokens.revokeRefreshToken(refreshTokenHash);

    return this.issueSession(user);
  }

  public async logout(input: LogoutInput): Promise<void> {
    await this.tokens.revokeRefreshToken(this.jwt.hashToken(input.refreshToken));
  }

  public async loginWithGoogle(input: GoogleLoginInput): Promise<AuthSession> {
    const identity = await this.oauth.verifyGoogleIdToken(input.idToken);

    if (!identity.emailVerified) {
      throw new AuthenticationAppError('Google account email is not verified.');
    }

    const existingUser = await this.users.findByEmail(identity.email);
    const verifiedAt = new Date();

    if (existingUser) {
      const linkedUser = await this.users.linkGoogleProvider(existingUser.id, {
        googleId: identity.providerUserId,
        ...(existingUser.emailVerifiedAt ? {} : { emailVerifiedAt: verifiedAt }),
        ...(identity.avatarUrl ? { avatarUrl: identity.avatarUrl } : {}),
        ...(identity.displayName ? { displayName: identity.displayName } : {}),
      });

      if (!linkedUser) {
        throw new ResourceNotFoundError('user', { userId: existingUser.id });
      }

      return this.issueSession(linkedUser);
    }

    const createdUser = await this.users.create({
      email: identity.email,
      role: 'user',
      emailVerifiedAt: verifiedAt,
      googleId: identity.providerUserId,
      providers: {
        google: true,
      },
      ...(identity.avatarUrl ? { avatarUrl: identity.avatarUrl } : {}),
      ...(identity.displayName ? { displayName: identity.displayName } : {}),
    });

    return this.issueSession(createdUser);
  }

  public async loginWithApple(input: AppleLoginInput): Promise<AuthSession> {
    const identity = await this.oauth.verifyAppleIdentityToken(input.identityToken);
    const verifiedAt = identity.emailVerified ? new Date() : undefined;
    const existingAppleUser = await this.users.findByAppleSubject(identity.subject);

    if (existingAppleUser) {
      return this.issueSession(existingAppleUser);
    }

    if (!identity.email) {
      throw new AuthenticationAppError(
        'Apple did not provide an email for this login. Try the original Apple account link flow again.',
      );
    }

    const existingEmailUser = await this.users.findByEmail(identity.email);

    if (existingEmailUser) {
      const linkedUser = await this.users.linkAppleProvider(existingEmailUser.id, {
        appleSubject: identity.subject,
        ...(existingEmailUser.emailVerifiedAt || !verifiedAt ? {} : { emailVerifiedAt: verifiedAt }),
      });

      if (!linkedUser) {
        throw new ResourceNotFoundError('user', { userId: existingEmailUser.id });
      }

      return this.issueSession(linkedUser);
    }

    const createdUser = await this.users.create({
      email: identity.email,
      role: 'user',
      appleSubject: identity.subject,
      providers: {
        apple: true,
      },
      ...(input.displayName ? { displayName: input.displayName } : {}),
      ...(verifiedAt ? { emailVerifiedAt: verifiedAt } : {}),
    });

    return this.issueSession(createdUser);
  }

  public async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new ResourceNotFoundError('user', { userId });
    }

    return this.toPublicUser(user);
  }

  private async registerWithPassword(
    input: RegisterInput,
    role: UserRole,
  ): Promise<RegistrationResult> {
    const passwordHash = await this.passwords.hash(input.password);
    const existingUser = await this.users.findByEmail(input.email);
    let user: UserRecord;

    if (existingUser) {
      if (existingUser.providers.password) {
        throw new DuplicateResourceError('user', { email: input.email });
      }

      if (existingUser.role !== role) {
        throw new ConflictAppError('An account with this email already exists for a different role.', {
          email: input.email,
        });
      }

      const updatedUser = await this.users.updatePasswordProvider(existingUser.id, passwordHash);

      if (!updatedUser) {
        throw new ResourceNotFoundError('user', { userId: existingUser.id });
      }

      user = updatedUser;
    } else {
      user = await this.users.create({
        email: input.email,
        role,
        passwordHash,
        providers: {
          password: true,
        },
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
      });
    }

    if (!user.emailVerifiedAt) {
      await this.sendVerificationEmail(user);
    }

    return {
      verificationRequired: true,
      user: this.toPublicUser(user),
    };
  }

  private async issueSession(user: UserRecord): Promise<AuthSession> {
    if (user.status === 'Blocked') {
      throw new AuthenticationAppError('This account is blocked. Contact support.');
    }

    const tokenPair = this.jwt.issueTokenPair({
      email: user.email,
      role: user.role,
      userId: user.id,
    });

    await this.persistRefreshToken(user.id, tokenPair);

    return {
      accessToken: tokenPair.accessToken,
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
      refreshToken: tokenPair.refreshToken,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt,
      user: this.toPublicUser(user),
    };
  }

  private async persistRefreshToken(userId: string, tokenPair: IssuedTokenPair): Promise<void> {
    await this.tokens.createRefreshToken({
      expiresAt: tokenPair.refreshTokenExpiresAt,
      tokenHash: tokenPair.refreshTokenHash,
      userId,
    });
  }

  private async sendVerificationEmail(user: UserRecord): Promise<void> {
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.tokens.markActiveEmailVerificationTokensUsedForUser(user.id);
    await this.tokens.createEmailVerificationToken({
      expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_SECONDS * 1000),
      tokenHash: this.hashEmailVerificationCode(user.id, code),
      userId: user.id,
    });
    await this.email.sendVerificationEmail({
      code,
      email: user.email,
    });
  }

  private async sendPasswordResetEmail(user: UserRecord): Promise<void> {
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.tokens.markActivePasswordResetTokensUsedForUser(user.id);
    await this.tokens.createPasswordResetToken({
      expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_SECONDS * 1000),
      tokenHash: this.hashPasswordResetCode(user.id, code),
      userId: user.id,
    });
    await this.email.sendPasswordResetEmail({
      code,
      email: user.email,
    });
  }

  private hashEmailVerificationCode(userId: string, code: string): string {
    return crypto
      .createHmac('sha256', env.EMAIL_VERIFICATION_SECRET)
      .update(`${userId}:${code}`)
      .digest('hex');
  }

  private hashPasswordResetCode(userId: string, code: string): string {
    return crypto
      .createHmac('sha256', env.EMAIL_VERIFICATION_SECRET)
      .update(`password-reset:${userId}:${code}`)
      .digest('hex');
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return {
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      id: user.id,
      providers: user.providers,
      role: user.role,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      ...(user.displayName ? { displayName: user.displayName } : {}),
      ...(user.firstName ? { firstName: user.firstName } : {}),
      ...(user.lastName ? { lastName: user.lastName } : {}),
    };
  }
}

export const authService = new AuthService(
  userRepository,
  authTokenRepository,
  passwordService,
  jwtService,
  emailService,
  oauthService,
);
