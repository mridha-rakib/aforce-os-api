import type { HydratedDocument } from 'mongoose';

import {
  EmailVerificationTokenModel,
  PasswordResetTokenModel,
  RefreshTokenModel,
  type EmailVerificationToken,
  type PasswordResetToken,
  type RefreshToken,
} from './auth-token.model';

export interface RefreshTokenRecord {
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly id: string;
  readonly revokedAt?: Date;
  readonly tokenHash: string;
  readonly updatedAt: Date;
  readonly userId: string;
}

export interface EmailVerificationTokenRecord {
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly id: string;
  readonly tokenHash: string;
  readonly updatedAt: Date;
  readonly usedAt?: Date;
  readonly userId: string;
}

export interface PasswordResetTokenRecord {
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly id: string;
  readonly tokenHash: string;
  readonly updatedAt: Date;
  readonly usedAt?: Date;
  readonly userId: string;
}

interface RefreshTokenSnapshot extends RefreshToken {
  createdAt: Date;
  revokedAt?: Date | null;
  updatedAt: Date;
}

interface EmailVerificationTokenSnapshot extends EmailVerificationToken {
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date | null;
}

interface PasswordResetTokenSnapshot extends PasswordResetToken {
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date | null;
}

export class AuthTokenRepository {
  public async createRefreshToken(input: {
    readonly expiresAt: Date;
    readonly tokenHash: string;
    readonly userId: string;
  }): Promise<RefreshTokenRecord> {
    const created = await RefreshTokenModel.create(input);

    return this.toRefreshTokenRecord(created);
  }

  public async findActiveRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const document = await RefreshTokenModel.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();

    return document ? this.toRefreshTokenRecord(document) : null;
  }

  public async revokeRefreshToken(tokenHash: string, revokedAt = new Date()): Promise<void> {
    await RefreshTokenModel.updateOne(
      {
        tokenHash,
        revokedAt: { $exists: false },
      },
      {
        $set: { revokedAt },
      },
    ).exec();
  }

  public async createEmailVerificationToken(input: {
    readonly expiresAt: Date;
    readonly tokenHash: string;
    readonly userId: string;
  }): Promise<EmailVerificationTokenRecord> {
    const created = await EmailVerificationTokenModel.create(input);

    return this.toEmailVerificationTokenRecord(created);
  }

  public async findActiveEmailVerificationToken(
    tokenHash: string,
  ): Promise<EmailVerificationTokenRecord | null> {
    const document = await EmailVerificationTokenModel.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();

    return document ? this.toEmailVerificationTokenRecord(document) : null;
  }

  public async findActiveEmailVerificationTokenForUser(
    userId: string,
    tokenHash: string,
  ): Promise<EmailVerificationTokenRecord | null> {
    const document = await EmailVerificationTokenModel.findOne({
      tokenHash,
      userId,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();

    return document ? this.toEmailVerificationTokenRecord(document) : null;
  }

  public async markEmailVerificationTokenUsed(tokenHash: string, usedAt = new Date()): Promise<void> {
    await EmailVerificationTokenModel.updateOne(
      {
        tokenHash,
        usedAt: { $exists: false },
      },
      {
        $set: { usedAt },
      },
    ).exec();
  }

  public async markActiveEmailVerificationTokensUsedForUser(
    userId: string,
    usedAt = new Date(),
  ): Promise<void> {
    await EmailVerificationTokenModel.updateMany(
      {
        userId,
        usedAt: { $exists: false },
        expiresAt: { $gt: usedAt },
      },
      {
        $set: { usedAt },
      },
    ).exec();
  }

  public async createPasswordResetToken(input: {
    readonly expiresAt: Date;
    readonly tokenHash: string;
    readonly userId: string;
  }): Promise<PasswordResetTokenRecord> {
    const created = await PasswordResetTokenModel.create(input);

    return this.toPasswordResetTokenRecord(created);
  }

  public async findActivePasswordResetTokenForUser(
    userId: string,
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null> {
    const document = await PasswordResetTokenModel.findOne({
      tokenHash,
      userId,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();

    return document ? this.toPasswordResetTokenRecord(document) : null;
  }

  public async markPasswordResetTokenUsed(tokenHash: string, usedAt = new Date()): Promise<void> {
    await PasswordResetTokenModel.updateOne(
      {
        tokenHash,
        usedAt: { $exists: false },
      },
      {
        $set: { usedAt },
      },
    ).exec();
  }

  public async markActivePasswordResetTokensUsedForUser(
    userId: string,
    usedAt = new Date(),
  ): Promise<void> {
    await PasswordResetTokenModel.updateMany(
      {
        userId,
        usedAt: { $exists: false },
        expiresAt: { $gt: usedAt },
      },
      {
        $set: { usedAt },
      },
    ).exec();
  }

  private toRefreshTokenRecord(document: HydratedDocument<RefreshToken>): RefreshTokenRecord {
    const snapshot = document.toObject() as RefreshTokenSnapshot;
    const record: RefreshTokenRecord = {
      createdAt: snapshot.createdAt,
      expiresAt: snapshot.expiresAt,
      id: document.id,
      tokenHash: snapshot.tokenHash,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };

    return snapshot.revokedAt ? { ...record, revokedAt: snapshot.revokedAt } : record;
  }

  private toEmailVerificationTokenRecord(
    document: HydratedDocument<EmailVerificationToken>,
  ): EmailVerificationTokenRecord {
    const snapshot = document.toObject() as EmailVerificationTokenSnapshot;
    const record: EmailVerificationTokenRecord = {
      createdAt: snapshot.createdAt,
      expiresAt: snapshot.expiresAt,
      id: document.id,
      tokenHash: snapshot.tokenHash,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };

    return snapshot.usedAt ? { ...record, usedAt: snapshot.usedAt } : record;
  }

  private toPasswordResetTokenRecord(
    document: HydratedDocument<PasswordResetToken>,
  ): PasswordResetTokenRecord {
    const snapshot = document.toObject() as PasswordResetTokenSnapshot;
    const record: PasswordResetTokenRecord = {
      createdAt: snapshot.createdAt,
      expiresAt: snapshot.expiresAt,
      id: document.id,
      tokenHash: snapshot.tokenHash,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };

    return snapshot.usedAt ? { ...record, usedAt: snapshot.usedAt } : record;
  }
}

export const authTokenRepository = new AuthTokenRepository();
