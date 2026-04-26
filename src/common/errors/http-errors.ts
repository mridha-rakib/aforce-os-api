import { StatusCodes } from 'http-status-codes';

import { AppError } from './app-error';

export class ValidationAppError extends AppError {
  public constructor(message = 'Request validation failed.', details?: unknown) {
    super(message, {
      code: 'VALIDATION_ERROR',
      details,
      hint: 'Check the request body, params, and query against the API schema.',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }
}

export class RouteNotFoundError extends AppError {
  public constructor(method: string, path: string) {
    super(`No route matches ${method} ${path}.`, {
      code: 'ROUTE_NOT_FOUND',
      details: { method, path },
      hint: 'Verify the API prefix, route path, and HTTP method.',
      statusCode: StatusCodes.NOT_FOUND,
    });
  }
}

export class ResourceNotFoundError extends AppError {
  public constructor(resourceName: string, details?: Record<string, unknown>) {
    super(`${resourceName} was not found.`, {
      code: `${resourceName.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_NOT_FOUND`,
      details,
      hint: `Verify that the supplied ${resourceName.toLowerCase()} identifier is correct.`,
      statusCode: StatusCodes.NOT_FOUND,
    });
  }
}

export class ConflictAppError extends AppError {
  public constructor(message: string, details?: Record<string, unknown>, hint?: string) {
    super(message, {
      code: 'RESOURCE_CONFLICT',
      details,
      hint: hint ?? 'Resolve the conflicting resource state and retry the request.',
      statusCode: StatusCodes.CONFLICT,
    });
  }
}

export class DuplicateResourceError extends AppError {
  public constructor(resourceName: string, details?: Record<string, unknown>) {
    super(`${resourceName} already exists.`, {
      code: `${resourceName.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_DUPLICATE`,
      details,
      hint: `Use a unique value for ${resourceName.toLowerCase()} and try again.`,
      statusCode: StatusCodes.CONFLICT,
    });
  }
}

export class DatabaseValidationError extends AppError {
  public constructor(message = 'Database validation failed.', details?: unknown) {
    super(message, {
      code: 'DATABASE_VALIDATION_ERROR',
      details,
      hint: 'Inspect the persisted payload and ensure all required database fields are valid.',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }
}

export class InternalServerAppError extends AppError {
  public constructor(message = 'An unexpected server error occurred.', details?: unknown) {
    super(message, {
      code: 'INTERNAL_SERVER_ERROR',
      details,
      hint: 'Review server logs with the request ID for the full failure context.',
      isOperational: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
}
