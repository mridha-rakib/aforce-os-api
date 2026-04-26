import { StatusCodes } from 'http-status-codes';

export interface AppErrorOptions {
  code?: string;
  details?: unknown;
  hint?: string;
  isOperational?: boolean;
  statusCode?: number;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly hint: string | undefined;
  public readonly isOperational: boolean;
  public readonly statusCode: number;

  public constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? 'APP_ERROR';
    this.details = options.details;
    this.hint = options.hint;
    this.isOperational = options.isOperational ?? true;
    this.statusCode = options.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  }

  public toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      details: this.details,
      hint: this.hint,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
