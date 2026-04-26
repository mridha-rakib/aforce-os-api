import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import helmet from 'helmet';

import { env, getCorsOrigins } from './config/env';
import { errorHandlerMiddleware } from './common/middleware/error-handler.middleware';
import { notFoundMiddleware } from './common/middleware/not-found.middleware';
import { requestContextMiddleware } from './common/middleware/request-context.middleware';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { apiModuleRegistry, type ApiModuleRegistry } from './modules';

export class ApiApplication {
  private readonly app: express.Express;
  private readonly limiter: RateLimitRequestHandler;

  public constructor(private readonly moduleRegistry: ApiModuleRegistry = apiModuleRegistry) {
    this.app = express();
    this.limiter = rateLimit({
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      legacyHeaders: false,
    });

    this.configure();
  }

  public build(): express.Express {
    return this.app;
  }

  private configure(): void {
    this.configureMiddleware();
    this.configureRoutes();
  }

  private configureMiddleware(): void {
    this.app.disable('x-powered-by');
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: getCorsOrigins(),
        credentials: true,
      }),
    );
    this.app.use(compression());
    this.app.use(express.json({ limit: `${env.REQUEST_BODY_LIMIT_MB}mb` }));
    this.app.use(express.urlencoded({ extended: true, limit: `${env.REQUEST_BODY_LIMIT_MB}mb` }));
    this.app.use(requestContextMiddleware);
    this.app.use(requestLoggerMiddleware);
  }

  private configureRoutes(): void {
    this.app.get('/', (_request, response) => {
      response.json({
        message: 'AForce API is running',
        status: 'ok',
      });
    });

    this.app.use(env.API_PREFIX, this.limiter, this.moduleRegistry.getRouter());
    this.app.use(notFoundMiddleware);
    this.app.use(errorHandlerMiddleware);
  }
}

export function createApp(): express.Express {
  return new ApiApplication().build();
}
