import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

import { ValidationAppError } from '../errors/http-errors';

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export class RequestValidator {
  public static validate(schemas: ValidationSchemas): RequestHandler {
    return (request, _response, next) => {
      try {
        if (schemas.body) {
          request.body = schemas.body.parse(request.body);
        }

        if (schemas.params) {
          request.params = schemas.params.parse(request.params) as typeof request.params;
        }

        if (schemas.query) {
          request.query = schemas.query.parse(request.query) as typeof request.query;
        }

        next();
      } catch (error) {
        next(new ValidationAppError('Request validation failed.', error));
      }
    };
  }
}
