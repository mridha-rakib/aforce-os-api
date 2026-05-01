# MinIO Storage

The backend uses an S3-compatible storage client. Local development points at MinIO, and AWS S3 can replace it later by changing environment values.

## Start MinIO

```powershell
docker compose up -d minio
```

MinIO API:

```text
http://127.0.0.1:9000
```

MinIO Console:

```text
http://127.0.0.1:9001
```

Default local credentials:

```text
minioadmin / minioadmin
```

## Backend Environment

```text
S3_ENDPOINT=http://127.0.0.1:9000
S3_PUBLIC_URL=http://127.0.0.1:9000
S3_BUCKET=aforce-media
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_READ=true
STORAGE_ALLOWED_MIME_TYPES=image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,application/pdf
STORAGE_MAX_FILE_SIZE_MB=50
```

The API creates the bucket automatically on the first upload and, when `S3_PUBLIC_READ=true`, applies a read policy for object URLs.

## Upload Endpoint

Authenticated admin endpoint:

```text
POST /api/v1/storage/upload
```

Multipart form fields:

```text
file=<binary file>
folder=content
```

Response data includes `bucket`, `key`, `url`, `contentType`, `size`, and `originalName`.

## Later AWS S3 Switch

For AWS S3, set AWS credentials, set `S3_BUCKET` and `S3_REGION`, set `S3_FORCE_PATH_STYLE=false`, and leave `S3_ENDPOINT` empty. Set `S3_PUBLIC_URL` to the bucket, CloudFront, or CDN URL you want clients to use.
