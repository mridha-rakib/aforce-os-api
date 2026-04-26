import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';

import { logger } from '../logger';

export const requestContextMiddleware: RequestHandler = (request, response, next) => {
  const requestId = request.header('x-request-id') ?? randomUUID();

  request.requestId = requestId;
  request.logger = logger.child({ requestId });
  response.setHeader('x-request-id', requestId);

  next();
};
