import type { ErrorRequestHandler } from 'express';

import { env } from '../../config/env';
import { errorMapper } from '../errors/error.mapper';

export const errorHandlerMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;
  const normalizedError = errorMapper.normalize(error);
  const level = normalizedError.statusCode >= 500 ? 'error' : 'warn';

  request.logger[level]('Request failed', {
    code: normalizedError.code,
    details: normalizedError.details,
    error: normalizedError,
    statusCode: normalizedError.statusCode,
  });

  response.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    error: {
      code: normalizedError.code,
      details: normalizedError.details,
      hint: normalizedError.hint,
      stack: env.NODE_ENV === 'development' ? normalizedError.stack : undefined,
    },
    requestId: request.requestId,
  });
};
