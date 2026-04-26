import type { AppLogger } from '../common/logger/logger.types';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      email: string;
      role: 'admin' | 'user';
      userId: string;
    }

    interface Request {
      logger: AppLogger;
      requestId: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
