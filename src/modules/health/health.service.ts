import mongoose from 'mongoose';

import { env } from '../../config/env';

const mongooseStateLabel: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export class HealthService {
  public getSnapshot(): Record<string, unknown> {
    return {
      aiEngineMode: env.AI_ENGINE_MODE,
      awsRegion: env.AWS_REGION,
      database: {
        name: mongoose.connection.name || 'unknown',
        readyState: mongooseStateLabel[mongoose.connection.readyState] ?? 'unknown',
      },
      loggerProvider: env.LOGGER_PROVIDER,
      nodeEnv: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(2)),
    };
  }
}

export const healthService = new HealthService();
