import { createServer } from 'http';
import type { Server } from 'http';

import { ApiApplication } from './app';
import { logger } from './common/logger';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './database/connect';

export class ApiServer {
  private server?: Server;

  public constructor(private readonly application: ApiApplication = new ApiApplication()) {}

  public async start(): Promise<void> {
    await connectDatabase();

    const app = this.application.build();
    this.server = createServer(app);

    this.registerProcessHandlers();

    await new Promise<void>((resolve) => {
      this.server?.listen(env.PORT, () => {
        logger.info('AForce API server started', {
          apiPrefix: env.API_PREFIX,
          loggerProvider: env.LOGGER_PROVIDER,
          port: env.PORT,
        });

        resolve();
      });
    });
  }

  private async shutdown(signal: string): Promise<void> {
    logger.warn(`Received ${signal}. Starting graceful shutdown.`);

    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await disconnectDatabase();
    logger.info('AForce API shutdown complete.');
  }

  private registerProcessHandlers(): void {
    process.once('SIGINT', () => {
      void this.shutdown('SIGINT').finally(() => process.exit(0));
    });

    process.once('SIGTERM', () => {
      void this.shutdown('SIGTERM').finally(() => process.exit(0));
    });

    process.once('unhandledRejection', (error) => {
      logger.fatal('Unhandled promise rejection detected.', { error });
    });

    process.once('uncaughtException', (error) => {
      logger.fatal('Uncaught exception detected.', { error });
      void this.shutdown('uncaughtException').finally(() => process.exit(1));
    });
  }
}

async function bootstrap(): Promise<void> {
  const server = new ApiServer();
  await server.start();
}

void bootstrap().catch((error: unknown) => {
  logger.fatal('Unable to bootstrap AForce API', { error });
  process.exit(1);
});
