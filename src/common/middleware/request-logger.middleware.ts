import type { RequestHandler } from 'express';

export const requestLoggerMiddleware: RequestHandler = (request, response, next) => {
  const startedAt = process.hrtime.bigint();

  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const context = {
      durationMs: Number(durationMs.toFixed(2)),
      method: request.method,
      path: request.originalUrl,
      requestId: request.requestId,
      statusCode: response.statusCode,
    };

    if (response.statusCode >= 500) {
      request.logger.error('Request completed with server error', context);
      return;
    }

    if (response.statusCode >= 400) {
      request.logger.warn('Request completed with client error', context);
      return;
    }

    request.logger.info('Request completed', context);
  });

  next();
};
