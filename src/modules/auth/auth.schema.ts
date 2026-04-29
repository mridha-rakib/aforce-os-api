import { z } from 'zod';

const emailSchema = z.string().email().trim().toLowerCase();
const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.');

export const registerBodySchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  email: emailSchema,
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const verifyEmailBodySchema = z.object({
  token: z.string().min(32),
});

export const resendVerificationBodySchema = z.object({
  email: emailSchema,
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const googleLoginBodySchema = z.object({
  idToken: z.string().min(1),
});

export const appleLoginBodySchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  identityToken: z.string().min(1),
});

export const registerRequestSchema = {
  body: registerBodySchema,
};

export const loginRequestSchema = {
  body: loginBodySchema,
};

export const verifyEmailRequestSchema = {
  body: verifyEmailBodySchema,
};

export const resendVerificationRequestSchema = {
  body: resendVerificationBodySchema,
};

export const refreshRequestSchema = {
  body: refreshBodySchema,
};

export const logoutRequestSchema = {
  body: logoutBodySchema,
};

export const googleLoginRequestSchema = {
  body: googleLoginBodySchema,
};

export const appleLoginRequestSchema = {
  body: appleLoginBodySchema,
};

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailBodySchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationBodySchema>;
export type RefreshInput = z.infer<typeof refreshBodySchema>;
export type LogoutInput = z.infer<typeof logoutBodySchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginBodySchema>;
export type AppleLoginInput = z.infer<typeof appleLoginBodySchema>;
