import { config } from 'dotenv';
import { z } from 'zod';

config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_PREFIX: z.string().min(1).default('/api/v1'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/aforce'),
  CORS_ORIGIN: z.string().min(1).default('*'),
  LOGGER_PROVIDER: z.enum(['pino', 'winston', 'dual']).default('dual'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('debug'),
  AWS_REGION: z.string().min(1).default('us-east-1'),
  AI_ENGINE_MODE: z.enum(['rules', 'hybrid']).default('rules'),
  REQUEST_BODY_LIMIT_MB: z.coerce.number().positive().default(2),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  JWT_ACCESS_SECRET: z.string().min(32).default('change-me-local-access-secret-minimum-32-characters'),
  JWT_REFRESH_SECRET: z.string().min(32).default('change-me-local-refresh-secret-minimum-32-characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60),
  EMAIL_VERIFICATION_SECRET: z
    .string()
    .min(32)
    .default('change-me-local-email-secret-minimum-32-characters'),
  EMAIL_VERIFICATION_TTL_SECONDS: z.coerce.number().int().positive().default(24 * 60 * 60),
  ADMIN_REGISTRATION_SECRET: z.string().min(16).default('change-me-local-admin-registration-secret'),
  APP_WEB_URL: z.string().url().default('http://localhost:5173'),
  APP_MOBILE_DEEP_LINK: z.string().min(1).default('aforce://auth'),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().min(1).default('AForce <noreply@localhost>'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  APPLE_CLIENT_ID: z.string().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const flattened = parsedEnv.error.flatten().fieldErrors;
  throw new Error(`Invalid environment configuration: ${JSON.stringify(flattened, null, 2)}`);
}

export const env = Object.freeze(parsedEnv.data);

export function getCorsOrigins(): string[] | true {
  if (env.CORS_ORIGIN === '*') {
    return true;
  }

  return env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
