import type { AppLogger } from '../common/logger/logger.types';

declare global {
  namespace Express {
    interface Request {
      logger: AppLogger;
      requestId: string;
    }
  }
}

export {};
