import { z } from 'zod';

import { logger } from '../common/logger';
import { env } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../database/connect';
import { passwordService } from '../modules/auth/password.service';
import { UserModel } from '../modules/users/user.model';

const adminSeedSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[0-9]/, 'Password must include a number.'),
  displayName: z.string().trim().min(1).max(120),
});

async function seedAdmin(): Promise<void> {
  const input = adminSeedSchema.parse({
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    displayName: env.ADMIN_DISPLAY_NAME,
  });
  const passwordHash = await passwordService.hash(input.password);
  const existingAdmin = await UserModel.findOne({ email: input.email }).exec();
  const verifiedAt = existingAdmin?.emailVerifiedAt ?? new Date();

  const adminUser = await UserModel.findOneAndUpdate(
    { email: input.email },
    {
      $set: {
        displayName: input.displayName,
        email: input.email,
        emailVerifiedAt: verifiedAt,
        passwordHash,
        'providers.password': true,
        role: 'admin',
      },
    },
    {
      returnDocument: 'after',
      setDefaultsOnInsert: true,
      upsert: true,
    },
  ).exec();

  if (!adminUser) {
    throw new Error('Admin seed failed.');
  }

  logger.info('Admin account seeded successfully', {
    email: adminUser.email,
    userId: adminUser.id,
  });
}

async function main(): Promise<void> {
  try {
    await connectDatabase();
    await seedAdmin();
  } finally {
    await disconnectDatabase();
  }
}

void main().catch((error: unknown) => {
  logger.error('Admin seed failed', { error });
  process.exitCode = 1;
});
