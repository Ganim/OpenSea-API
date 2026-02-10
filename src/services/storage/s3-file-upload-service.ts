import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

import { env } from '@/@env';

import type {
  FileUploadService,
  UploadOptions,
  UploadResult,
} from './file-upload-service';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_PRESIGNED_URL_EXPIRATION = 3600; // 1 hour in seconds

export class S3FileUploadService implements FileUploadService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor() {
    this.endpoint = env.S3_ENDPOINT!;
    this.bucket = env.S3_BUCKET;

    this.s3Client = new S3Client({
      region: env.S3_REGION,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const maxSize = options.maxSize ?? DEFAULT_MAX_FILE_SIZE;

    if (fileBuffer.length > maxSize) {
      throw new Error(
        `File size ${fileBuffer.length} bytes exceeds maximum allowed size of ${maxSize} bytes.`,
      );
    }

    if (options.allowedTypes && !options.allowedTypes.includes(mimeType)) {
      throw new Error(
        `MIME type "${mimeType}" is not allowed. Allowed types: ${options.allowedTypes.join(', ')}.`,
      );
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `${options.prefix}/${randomUUID()}-${sanitizedFileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(putCommand);

    const objectUrl = `${this.endpoint}/${this.bucket}/${objectKey}`;

    return {
      key: objectKey,
      url: objectUrl,
      size: fileBuffer.length,
      mimeType,
    };
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = DEFAULT_PRESIGNED_URL_EXPIRATION,
  ): Promise<string> {
    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn,
    });

    return presignedUrl;
  }

  async delete(key: string): Promise<void> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(deleteCommand);
  }
}
