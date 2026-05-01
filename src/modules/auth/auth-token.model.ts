import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    expiresAt: {
      index: true,
      required: true,
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    tokenHash: {
      index: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    userId: {
      index: true,
      required: true,
      trim: true,
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const emailVerificationTokenSchema = new Schema(
  {
    expiresAt: {
      index: true,
      required: true,
      type: Date,
    },
    tokenHash: {
      index: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    usedAt: {
      type: Date,
    },
    userId: {
      index: true,
      required: true,
      trim: true,
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const passwordResetTokenSchema = new Schema(
  {
    expiresAt: {
      index: true,
      required: true,
      type: Date,
    },
    tokenHash: {
      index: true,
      required: true,
      trim: true,
      type: String,
    },
    usedAt: {
      type: Date,
    },
    userId: {
      index: true,
      required: true,
      trim: true,
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type RefreshToken = InferSchemaType<typeof refreshTokenSchema>;
export type EmailVerificationToken = InferSchemaType<typeof emailVerificationTokenSchema>;
export type PasswordResetToken = InferSchemaType<typeof passwordResetTokenSchema>;

export const RefreshTokenModel = model<RefreshToken>('RefreshToken', refreshTokenSchema);
export const EmailVerificationTokenModel = model<EmailVerificationToken>(
  'EmailVerificationToken',
  emailVerificationTokenSchema,
);
export const PasswordResetTokenModel = model<PasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema,
);
