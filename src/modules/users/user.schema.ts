import { z } from 'zod';

export const userStatusSchema = z.enum(['Active', 'Blocked']);
export const userSubscriptionSchema = z.enum(['Free', 'Pro', 'Enterprise']);

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );

export const listUsersQuerySchema = z.object({
  search: optionalTrimmedString(120),
  status: userStatusSchema.optional(),
  subscription: userSubscriptionSchema.optional(),
});

export const createUserBodySchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  hydrationScore: z.coerce.number().min(0).max(100).default(0),
  name: z.string().trim().min(1).max(120),
  status: userStatusSchema.default('Active'),
  subscription: userSubscriptionSchema.default('Free'),
});

export const updateUserBodySchema = createUserBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one user field is required.',
);

export const userParamsSchema = z.object({
  userId: z.string().min(1),
});

export const listUsersRequestSchema = {
  query: listUsersQuerySchema,
};

export const createUserRequestSchema = {
  body: createUserBodySchema,
};

export const updateUserRequestSchema = {
  body: updateUserBodySchema,
  params: userParamsSchema,
};

export const userParamsRequestSchema = {
  params: userParamsSchema,
};

export type CreateAdminUserInput = z.infer<typeof createUserBodySchema>;
export type ListAdminUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateAdminUserInput = z.infer<typeof updateUserBodySchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
