import type { RequestHandler } from 'express';

import { RouteNotFoundError } from '../errors/http-errors';

export const notFoundMiddleware: RequestHandler = (request, _response, next) => {
  next(new RouteNotFoundError(request.method, request.originalUrl));
};
