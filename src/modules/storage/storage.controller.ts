import { ZodError } from 'zod';

import { BaseController } from '../../common/http/base-controller';
import { ValidationAppError } from '../../common/errors/http-errors';
import { uploadFileBodySchema } from './storage.schema';
import { storageService, type StorageService } from './storage.service';

export class StorageController extends BaseController {
  public constructor(private readonly service: StorageService) {
    super();
  }

  public readonly uploadFile = this.handleRequest(async (request, response) => {
    const file = request.file;

    if (!file) {
      throw new ValidationAppError('A multipart file field named "file" is required.');
    }

    try {
      const body = uploadFileBodySchema.parse(request.body);
      const storedFile = await this.service.uploadFile({
        buffer: file.buffer,
        contentType: file.mimetype,
        folder: body.folder,
        originalName: file.originalname,
        size: file.size,
        ...(request.user?.userId ? { uploadedBy: request.user.userId } : {}),
      });

      this.created(response, 'File uploaded successfully.', storedFile);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationAppError('Request validation failed.', error.flatten());
      }

      throw error;
    }
  });
}

export const storageController = new StorageController(storageService);
