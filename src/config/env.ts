import { config } from 'dotenv';
import { z } from 'zod';

config({ quiet: true });

const booleanStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  if (value.toLowerCase() === 'true') {
    return true;
  }

  if (value.toLowerCase() === 'false') {
    return false;
  }

  return value;
}, z.boolean());

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_PREFIX: z.string().min(1).default('/api/v1'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/aforce'),
  CORS_ORIGIN: z.string().min(1).default('*'),
  LOGGER_PROVIDER: z.enum(['pino', 'winston', 'dual']).default('dual'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('debug'),
  AWS_REGION: z.string().min(1).default('us-east-1'),
  S3_ENDPOINT: optionalUrlSchema.default('http://127.0.0.1:9000'),
  S3_PUBLIC_URL: optionalUrlSchema.default('http://127.0.0.1:9000'),
  S3_BUCKET: z.string().min(3).default('aforce-media'),
  S3_ACCESS_KEY_ID: z.string().min(1).default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().min(1).default('minioadmin'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_FORCE_PATH_STYLE: booleanStringSchema.default(true),
  S3_PUBLIC_READ: booleanStringSchema.default(true),
  STORAGE_ALLOWED_MIME_TYPES: z
    .string()
    .min(1)
    .default('image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,application/pdf'),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(50),
  AI_ENGINE_MODE: z.enum(['rules', 'hybrid']).default('rules'),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().min(1).default('gpt-5.4-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(700),
  REQUEST_BODY_LIMIT_MB: z.coerce.number().positive().default(8),
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
  PASSWORD_RESET_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  ADMIN_EMAIL: z.string().default(''),
  ADMIN_PASSWORD: z.string().default(''),
  ADMIN_DISPLAY_NAME: z.string().default('AForce Admin'),
  APP_WEB_URL: z.string().url().default('http://localhost:5173'),
  APP_MOBILE_DEEP_LINK: z.string().min(1).default('aforce://auth'),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().min(1).default('AForce <noreply@localhost>'),
  SMTP_HOST: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: booleanStringSchema.default(false),
  SMTP_USER: z.string().default(''),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_WEB_CLIENT_ID: z.string().default(''),
  GOOGLE_ANDROID_CLIENT_ID: z.string().default(''),
  GOOGLE_IOS_CLIENT_ID: z.string().default(''),
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

export function getGoogleClientIds(): string[] {
  return Array.from(
    new Set(
      [
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_WEB_CLIENT_ID,
        env.GOOGLE_ANDROID_CLIENT_ID,
        env.GOOGLE_IOS_CLIENT_ID,
      ]
        .map((clientId) => clientId.trim())
        .filter(Boolean),
    ),
  );
}
