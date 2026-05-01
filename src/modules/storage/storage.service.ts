import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { env } from '../../config/env';
import { ValidationAppError } from '../../common/errors/http-errors';

export interface UploadFileInput {
  readonly buffer: Buffer;
  readonly contentType: string;
  readonly folder?: string;
  readonly originalName: string;
  readonly size: number;
  readonly uploadedBy?: string;
}

export interface StoredFileDto {
  readonly bucket: string;
  readonly contentType: string;
  readonly key: string;
  readonly originalName: string;
  readonly size: number;
  readonly url: string;
}

export class StorageService {
  private readonly allowedMimeTypes: Set<string>;
  private readonly client: S3Client;
  private bucketReadyPromise: Promise<void> | undefined;

  public constructor() {
    this.allowedMimeTypes = new Set(
      env.STORAGE_ALLOWED_MIME_TYPES.split(',')
        .map((mimeType) => mimeType.trim())
        .filter(Boolean),
    );

    const config: S3ClientConfig = {
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      region: env.S3_REGION,
    };

    if (env.S3_ENDPOINT) {
      config.endpoint = env.S3_ENDPOINT;
    }

    this.client = new S3Client(config);
  }

  public async uploadFile(input: UploadFileInput): Promise<StoredFileDto> {
    this.validateFile(input);

    await this.ensureBucket();

    const key = this.createObjectKey(input.folder ?? 'content', input.originalName);

    await this.client.send(
      new PutObjectCommand({
        Body: input.buffer,
        Bucket: env.S3_BUCKET,
        ContentLength: input.size,
        ContentType: input.contentType,
        Key: key,
        Metadata: {
          originalName: input.originalName,
          ...(input.uploadedBy ? { uploadedBy: input.uploadedBy } : {}),
        },
      }),
    );

    return {
      bucket: env.S3_BUCKET,
      contentType: input.contentType,
      key,
      originalName: input.originalName,
      size: input.size,
      url: this.buildPublicUrl(key),
    };
  }

  private validateFile(input: UploadFileInput): void {
    if (input.size <= 0) {
      throw new ValidationAppError('Uploaded file is empty.');
    }

    const maxBytes = env.STORAGE_MAX_FILE_SIZE_MB * 1024 * 1024;

    if (input.size > maxBytes) {
      throw new ValidationAppError(`Uploaded file must be ${env.STORAGE_MAX_FILE_SIZE_MB}MB or smaller.`, {
        maxBytes,
        size: input.size,
      });
    }

    if (!this.allowedMimeTypes.has(input.contentType)) {
      throw new ValidationAppError('Uploaded file type is not allowed.', {
        allowedMimeTypes: Array.from(this.allowedMimeTypes),
        contentType: input.contentType,
      });
    }
  }

  private async ensureBucket(): Promise<void> {
    this.bucketReadyPromise ??= this.createBucketIfMissing().catch((error: unknown) => {
      this.bucketReadyPromise = undefined;
      throw error;
    });

    return this.bucketReadyPromise;
  }

  private async createBucketIfMissing(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
    } catch (error) {
      if (!this.isMissingBucketError(error)) {
        throw error;
      }

      await this.client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    }

    if (env.S3_PUBLIC_READ) {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: env.S3_BUCKET,
          Policy: JSON.stringify({
            Statement: [
              {
                Action: ['s3:GetObject'],
                Effect: 'Allow',
                Principal: '*',
                Resource: [`arn:aws:s3:::${env.S3_BUCKET}/*`],
                Sid: 'PublicReadObjects',
              },
            ],
            Version: '2012-10-17',
          }),
        }),
      );
    }
  }

  private isMissingBucketError(error: unknown): boolean {
    if (error instanceof S3ServiceException) {
      return error.name === 'NotFound' || error.name === 'NoSuchBucket' || error.$metadata.httpStatusCode === 404;
    }

    return false;
  }

  private createObjectKey(folder: string, originalName: string): string {
    const safeFolder = this.sanitizeFolder(folder);
    const safeFileName = this.sanitizeFileName(originalName);
    const datePrefix = new Date().toISOString().slice(0, 10);

    return `${safeFolder}/${datePrefix}/${randomUUID()}-${safeFileName}`;
  }

  private sanitizeFolder(folder: string): string {
    const safeFolder = folder
      .split('/')
      .map((part) => part.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-'))
      .map((part) => part.replace(/^-|-$/g, ''))
      .filter(Boolean)
      .join('/');

    return safeFolder || 'uploads';
  }

  private sanitizeFileName(originalName: string): string {
    const parsed = path.parse(originalName);
    const baseName = parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const extension = parsed.ext.toLowerCase().replace(/[^.a-z0-9]+/g, '');

    return `${baseName || 'file'}${extension}`;
  }

  private buildPublicUrl(key: string): string {
    const baseUrl = (env.S3_PUBLIC_URL ?? this.getAwsBucketUrl()).replace(/\/+$/g, '');
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');

    return `${baseUrl}/${env.S3_BUCKET}/${encodedKey}`;
  }

  private getAwsBucketUrl(): string {
    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
  }
}

export const storageService = new StorageService();
