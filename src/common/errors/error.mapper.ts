import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { AppError } from './app-error';
import {
  DatabaseValidationError,
  DuplicateResourceError,
  InternalServerAppError,
  ValidationAppError,
} from './http-errors';

interface MongoDuplicateKeyError extends Error {
  code: 11000;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

function isMongoDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export class ErrorMapper {
  public normalize(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof ZodError) {
      return new ValidationAppError('Request validation failed.', error.flatten());
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return new DatabaseValidationError('Database validation failed.', error.errors);
    }

    if (error instanceof mongoose.Error.CastError) {
      const castValue: unknown = error.value;

      return new ValidationAppError(`Invalid value received for "${error.path}".`, {
        path: error.path,
        value: castValue,
      });
    }

    if (isMongoDuplicateKeyError(error)) {
      return new DuplicateResourceError('resource', error.keyValue ?? error.keyPattern);
    }

    if (error instanceof Error) {
      return new InternalServerAppError(error.message, {
        name: error.name,
        stack: error.stack,
      });
    }

    return new InternalServerAppError('An unknown error occurred.', { error });
  }
}

export const errorMapper = new ErrorMapper();
