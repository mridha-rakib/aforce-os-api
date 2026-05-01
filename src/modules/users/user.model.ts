import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    appleSubject: {
      index: true,
      sparse: true,
      trim: true,
      type: String,
    },
    avatarUrl: {
      trim: true,
      type: String,
    },
    displayName: {
      trim: true,
      type: String,
    },
    email: {
      index: true,
      lowercase: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    emailVerifiedAt: {
      type: Date,
    },
    firstName: {
      trim: true,
      type: String,
    },
    googleId: {
      index: true,
      sparse: true,
      trim: true,
      type: String,
    },
    hydrationScore: {
      default: 0,
      max: 100,
      min: 0,
      type: Number,
    },
    lastName: {
      trim: true,
      type: String,
    },
    passwordHash: {
      type: String,
    },
    providers: {
      apple: {
        default: false,
        type: Boolean,
      },
      google: {
        default: false,
        type: Boolean,
      },
      password: {
        default: false,
        type: Boolean,
      },
    },
    role: {
      default: 'user',
      enum: ['admin', 'user'],
      index: true,
      required: true,
      type: String,
    },
    status: {
      default: 'Active',
      enum: ['Active', 'Blocked'],
      index: true,
      required: true,
      type: String,
    },
    subscription: {
      default: 'Free',
      enum: ['Free', 'Pro', 'Enterprise'],
      index: true,
      required: true,
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model<User>('User', userSchema);
