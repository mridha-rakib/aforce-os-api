import type { HydratedDocument, UpdateQuery } from 'mongoose';

import { UserModel, type User } from './user.model';

export type UserRole = 'admin' | 'user';
export type UserStatus = 'Active' | 'Blocked';
export type UserSubscription = 'Free' | 'Pro' | 'Enterprise';

export interface CreateUserInput {
  readonly appleSubject?: string;
  readonly avatarUrl?: string;
  readonly displayName?: string;
  readonly email: string;
  readonly emailVerifiedAt?: Date;
  readonly firstName?: string;
  readonly googleId?: string;
  readonly hydrationScore?: number;
  readonly lastName?: string;
  readonly passwordHash?: string;
  readonly providers?: {
    readonly apple?: boolean;
    readonly google?: boolean;
    readonly password?: boolean;
  };
  readonly role: UserRole;
  readonly status?: UserStatus;
  readonly subscription?: UserSubscription;
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
  readonly hydrationScore: number;
  readonly id: string;
  readonly lastName?: string;
  readonly passwordHash?: string;
  readonly providers: {
    readonly apple: boolean;
    readonly google: boolean;
    readonly password: boolean;
  };
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly subscription: UserSubscription;
  readonly updatedAt: Date;
}

export interface ListUsersInput {
  readonly search?: string;
  readonly status?: UserStatus;
  readonly subscription?: UserSubscription;
}

export interface UpdateUserInput {
  readonly displayName?: string;
  readonly email?: string;
  readonly hydrationScore?: number;
  readonly status?: UserStatus;
  readonly subscription?: UserSubscription;
}

interface UserSnapshot {
  appleSubject?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  displayName?: string | null;
  email: string;
  emailVerifiedAt?: Date | null;
  firstName?: string | null;
  googleId?: string | null;
  hydrationScore?: number | null;
  lastName?: string | null;
  passwordHash?: string | null;
  providers?: {
    apple?: boolean | null;
    google?: boolean | null;
    password?: boolean | null;
  } | null;
  role: UserRole;
  status?: UserStatus | null;
  subscription?: UserSubscription | null;
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

  public async deleteById(userId: string): Promise<UserRecord | null> {
    const document = await UserModel.findOneAndDelete({ _id: userId, role: 'user' }).exec();

    return document ? this.toRecord(document) : null;
  }

  public async findMany(input: ListUsersInput = {}): Promise<UserRecord[]> {
    const filter: Record<string, unknown> = {
      role: 'user',
    };
    const andFilters: Record<string, unknown>[] = [];

    if (input.status) {
      if (input.status === 'Active') {
        andFilters.push({
          $or: [{ status: 'Active' }, { status: { $exists: false } }],
        });
      } else {
        filter.status = input.status;
      }
    }

    if (input.subscription) {
      if (input.subscription === 'Free') {
        andFilters.push({
          $or: [{ subscription: 'Free' }, { subscription: { $exists: false } }],
        });
      } else {
        filter.subscription = input.subscription;
      }
    }

    if (input.search) {
      const searchPattern = new RegExp(input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      andFilters.push({
        $or: [
          { email: searchPattern },
          { displayName: searchPattern },
          { firstName: searchPattern },
          { lastName: searchPattern },
        ],
      });
    }

    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    const documents = await UserModel.find(filter).sort({ createdAt: -1 }).exec();

    return documents.map((document) => this.toRecord(document));
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

  public async updateById(userId: string, input: UpdateUserInput): Promise<UserRecord | null> {
    const $set: Record<string, unknown> = {};

    if (input.displayName !== undefined) {
      $set.displayName = input.displayName;
    }

    if (input.email !== undefined) {
      $set.email = input.email.toLowerCase();
    }

    if (input.hydrationScore !== undefined) {
      $set.hydrationScore = input.hydrationScore;
    }

    if (input.status !== undefined) {
      $set.status = input.status;
    }

    if (input.subscription !== undefined) {
      $set.subscription = input.subscription;
    }

    const document = await UserModel.findOneAndUpdate(
      { _id: userId, role: 'user' },
      { $set },
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

    if (input.hydrationScore !== undefined) {
      document.hydrationScore = input.hydrationScore;
    }

    if (input.lastName) {
      document.lastName = input.lastName;
    }

    if (input.passwordHash) {
      document.passwordHash = input.passwordHash;
    }

    if (input.status) {
      document.status = input.status;
    }

    if (input.subscription) {
      document.subscription = input.subscription;
    }
  }

  private toRecord(document: HydratedDocument<User>): UserRecord {
    const snapshot = document.toObject() as UserSnapshot;
    const record: UserRecord = {
      createdAt: snapshot.createdAt,
      email: snapshot.email,
      hydrationScore: snapshot.hydrationScore ?? 0,
      id: document.id,
      providers: {
        apple: snapshot.providers?.apple ?? false,
        google: snapshot.providers?.google ?? false,
        password: snapshot.providers?.password ?? false,
      },
      role: snapshot.role,
      status: snapshot.status ?? 'Active',
      subscription: snapshot.subscription ?? 'Free',
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
