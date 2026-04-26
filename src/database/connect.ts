import mongoose from 'mongoose';

import { env } from '../config/env';
import { logger } from '../common/logger';

let listenersBound = false;

function bindConnectionListeners(): void {
  if (listenersBound) {
    return;
  }

  listenersBound = true;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection closed');
  });
}

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  bindConnectionListeners();
  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
