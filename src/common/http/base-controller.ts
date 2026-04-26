import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { sendSuccess } from './api-response';

type ControllerExecutor = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<void> | void;

export abstract class BaseController {
  protected created<T>(response: Response, message: string, data: T): Response {
    return sendSuccess(response, {
      data,
      message,
      statusCode: StatusCodes.CREATED,
    });
  }

  protected noContent(response: Response): Response {
    return response.status(StatusCodes.NO_CONTENT).send();
  }

  protected ok<T>(response: Response, message: string, data: T): Response {
    return sendSuccess(response, {
      data,
      message,
      statusCode: StatusCodes.OK,
    });
  }

  protected handleRequest(executor: ControllerExecutor): RequestHandler {
    return (request, response, next) => {
      void Promise.resolve(executor.call(this, request, response, next)).catch(next);
    };
  }
}
