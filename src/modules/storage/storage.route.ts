import multer from 'multer';
import type { RequestHandler } from 'express';

import { env } from '../../config/env';
import { BaseRoute } from '../../common/http/base-route';
import { ValidationAppError } from '../../common/errors/http-errors';
import { authenticate, requireRole } from '../../common/middleware/auth.middleware';
import { storageController, type StorageController } from './storage.controller';

const upload = multer({
  limits: {
    fileSize: env.STORAGE_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  storage: multer.memoryStorage(),
});

const uploadSingleFile: RequestHandler = (request, response, next) => {
  upload.single('file')(request, response, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      next(
        new ValidationAppError('File upload failed.', {
          code: error.code,
          field: error.field,
          message: error.message,
        }),
      );
      return;
    }

    next(error);
  });
};

export class StorageRoute extends BaseRoute {
  public constructor(private readonly controller: StorageController) {
    super('/storage', 'admin');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.post(
      '/upload',
      { name: 'Upload File' },
      authenticate,
      requireRole('admin'),
      uploadSingleFile,
      this.controller.uploadFile,
    );
  }
}

export const storageRoute = new StorageRoute(storageController);
