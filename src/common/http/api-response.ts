import type { Response } from 'express';

export interface ApiSuccessPayload<T> {
  data: T;
  message: string;
  meta?: Record<string, unknown>;
  statusCode?: number;
}

export function sendSuccess<T>(response: Response, payload: ApiSuccessPayload<T>): Response {
  return response.status(payload.statusCode ?? 200).json({
    success: true,
    message: payload.message,
    data: payload.data,
    meta: payload.meta,
  });
}
