import { config } from 'dotenv';
import { z } from 'zod';

config();

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
