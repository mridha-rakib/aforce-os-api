import type { HydratedDocument, UpdateQuery } from 'mongoose';

import { UserModel, type User } from './user.model';

export type UserRole = 'admin' | 'user';

export interface CreateUserInput {
  readonly appleSubject?: string;
  readonly avatarUrl?: string;
  readonly displayName?: string;
  readonly email: string;
  readonly emailVerifiedAt?: Date;
  readonly firstName?: string;
  readonly googleId?: string;
  readonly lastName?: string;
  readonly passwordHash?: string;
  readonly providers?: {
    readonly apple?: boolean;
    readonly google?: boolean;
    readonly password?: boolean;
  };
  readonly role: UserRole;
}

export interface UserRecord {
  readonly appleSubject?: string;
  readonly avatarUrl?: string;
  readonly createdAt: Date;
  readonly displayName?: string;
  readonly email: string;
  readonly emailVerifiedAt?: Date;
  readonly firstName?: string;
  readonly googleId?: string;
  readonly id: string;
  readonly lastName?: string;
  readonly passwordHash?: string;
  readonly providers: {
    readonly apple: boolean;
    readonly google: boolean;
    readonly password: boolean;
  };
  readonly role: UserRole;
  readonly updatedAt: Date;
}

interface UserSnapshot extends User {
  appleSubject?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  displayName?: string | null;
  emailVerifiedAt?: Date | null;
  firstName?: string | null;
  googleId?: string | null;
  lastName?: string | null;
  passwordHash?: string | null;
  updatedAt: Date;
}

export class UserRepository {
  public async create(input: CreateUserInput): Promise<UserRecord> {
    const created = new UserModel({
      email: input.email,
      role: input.role,
      providers: input.providers,
    });

    this.assignOptionalFields(created, input);
    await created.save();

    return this.toRecord(created);
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const document = await UserModel.findOne({ email: email.toLowerCase() }).exec();

    return document ? this.toRecord(document) : null;
  }

  public async findByAppleSubject(appleSubject: string): Promise<UserRecord | null> {
    const document = await UserModel.findOne({ appleSubject }).exec();

    return document ? this.toRecord(document) : null;
  }

  public async findById(id: string): Promise<UserRecord | null> {
    const document = await UserModel.findById(id).exec();

    return document ? this.toRecord(document) : null;
  }

  public async markEmailVerified(userId: string, verifiedAt = new Date()): Promise<UserRecord | null> {
    const document = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { emailVerifiedAt: verifiedAt } },
      { new: true },
    ).exec();

    return document ? this.toRecord(document) : null;
  }

  public async updatePasswordProvider(userId: string, passwordHash: string): Promise<UserRecord | null> {
    const document = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordHash,
          'providers.password': true,
        },
      },
      { new: true },
    ).exec();

    return document ? this.toRecord(document) : null;
  }

  public async linkGoogleProvider(
    userId: string,
    input: {
      readonly avatarUrl?: string;
      readonly displayName?: string;
      readonly emailVerifiedAt?: Date;
      readonly googleId: string;
    },
  ): Promise<UserRecord | null> {
    const set: Record<string, unknown> = {
      googleId: input.googleId,
      'providers.google': true,
    };

    if (input.avatarUrl) {
      set.avatarUrl = input.avatarUrl;
    }

    if (input.displayName) {
      set.displayName = input.displayName;
    }

    if (input.emailVerifiedAt) {
      set.emailVerifiedAt = input.emailVerifiedAt;
    }

    const update: UpdateQuery<User> = {
      $set: set,
    };

    const document = await UserModel.findByIdAndUpdate(userId, update, { new: true }).exec();

    return document ? this.toRecord(document) : null;
  }

  public async linkAppleProvider(
    userId: string,
    input: {
      readonly appleSubject: string;
      readonly emailVerifiedAt?: Date;
    },
  ): Promise<UserRecord | null> {
    const set: Record<string, unknown> = {
      appleSubject: input.appleSubject,
      'providers.apple': true,
    };

    if (input.emailVerifiedAt) {
      set.emailVerifiedAt = input.emailVerifiedAt;
    }

    const update: UpdateQuery<User> = {
      $set: set,
    };

    const document = await UserModel.findByIdAndUpdate(userId, update, { new: true }).exec();

    return document ? this.toRecord(document) : null;
  }

  private assignOptionalFields(document: HydratedDocument<User>, input: CreateUserInput): void {
    if (input.appleSubject) {
      document.appleSubject = input.appleSubject;
    }

    if (input.avatarUrl) {
      document.avatarUrl = input.avatarUrl;
    }

    if (input.displayName) {
      document.displayName = input.displayName;
    }

    if (input.emailVerifiedAt) {
      document.emailVerifiedAt = input.emailVerifiedAt;
    }

    if (input.firstName) {
      document.firstName = input.firstName;
    }

    if (input.googleId) {
      document.googleId = input.googleId;
    }

    if (input.lastName) {
      document.lastName = input.lastName;
    }

    if (input.passwordHash) {
      document.passwordHash = input.passwordHash;
    }
  }

  private toRecord(document: HydratedDocument<User>): UserRecord {
    const snapshot = document.toObject() as UserSnapshot;
    const record: UserRecord = {
      createdAt: snapshot.createdAt,
      email: snapshot.email,
      id: document.id,
      providers: {
        apple: snapshot.providers?.apple ?? false,
        google: snapshot.providers?.google ?? false,
        password: snapshot.providers?.password ?? false,
      },
      role: snapshot.role,
      updatedAt: snapshot.updatedAt,
    };

    return {
      ...record,
      ...(snapshot.appleSubject ? { appleSubject: snapshot.appleSubject } : {}),
      ...(snapshot.avatarUrl ? { avatarUrl: snapshot.avatarUrl } : {}),
      ...(snapshot.displayName ? { displayName: snapshot.displayName } : {}),
      ...(snapshot.emailVerifiedAt ? { emailVerifiedAt: snapshot.emailVerifiedAt } : {}),
      ...(snapshot.firstName ? { firstName: snapshot.firstName } : {}),
      ...(snapshot.googleId ? { googleId: snapshot.googleId } : {}),
      ...(snapshot.lastName ? { lastName: snapshot.lastName } : {}),
      ...(snapshot.passwordHash ? { passwordHash: snapshot.passwordHash } : {}),
    };
  }
}

export const userRepository = new UserRepository();
