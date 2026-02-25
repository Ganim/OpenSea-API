import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import { env } from '@/@env';

import type {
  FileUploadService,
  MultipartCompletePart,
  MultipartPartUrl,
  MultipartUploadInit,
  UploadOptions,
  UploadResult,
} from './file-upload-service';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_PRESIGNED_URL_EXPIRATION = 3600; // 1 hour in seconds
const PRESIGNED_URL_CACHE_TTL = 50 * 60 * 1000; // 50 minutes (URLs expire in 60min)
const PRESIGNED_URL_CACHE_MAX = 500;

const COMPRESSIBLE_MIME_PREFIXES = ['text/'];
const COMPRESSIBLE_MIME_TYPES = new Set([
  'application/json',
  'application/xml',
  'application/xhtml+xml',
  'application/javascript',
  'application/typescript',
  'application/x-yaml',
  'application/csv',
  'image/svg+xml',
]);

function isCompressible(mimeType: string): boolean {
  if (COMPRESSIBLE_MIME_TYPES.has(mimeType)) return true;
  return COMPRESSIBLE_MIME_PREFIXES.some((p) => mimeType.startsWith(p));
}

interface CachedUrl {
  url: string;
  expiresAt: number;
}

export class S3FileUploadService implements FileUploadService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly presignedUrlCache = new Map<string, CachedUrl>();

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

    // Gzip compressible text-based files before uploading
    let body: Buffer = fileBuffer;
    let contentEncoding: string | undefined;

    if (isCompressible(mimeType) && fileBuffer.length > 1024) {
      const compressed = gzipSync(fileBuffer);
      // Only use compression if it actually reduces size
      if (compressed.length < fileBuffer.length) {
        body = compressed;
        contentEncoding = 'gzip';
      }
    }

    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: body,
      ContentType: mimeType,
      ContentEncoding: contentEncoding,
    });

    await this.s3Client.send(putCommand);

    const objectUrl = `${this.endpoint}/${this.bucket}/${objectKey}`;

    return {
      key: objectKey,
      url: objectUrl,
      size: fileBuffer.length, // Original size for DB records
      mimeType,
    };
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = DEFAULT_PRESIGNED_URL_EXPIRATION,
  ): Promise<string> {
    const cacheKey = `${key}:${expiresIn}`;
    const cached = this.presignedUrlCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn,
    });

    // Evict oldest entries if cache is full
    if (this.presignedUrlCache.size >= PRESIGNED_URL_CACHE_MAX) {
      const firstKey = this.presignedUrlCache.keys().next().value;
      if (firstKey) this.presignedUrlCache.delete(firstKey);
    }

    this.presignedUrlCache.set(cacheKey, {
      url: presignedUrl,
      expiresAt: Date.now() + PRESIGNED_URL_CACHE_TTL,
    });

    return presignedUrl;
  }

  async getObject(key: string): Promise<Buffer> {
    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(getCommand);
    const bodyBytes = await response.Body?.transformToByteArray();

    if (!bodyBytes) {
      throw new Error(`Empty response for key: ${key}`);
    }

    return Buffer.from(bodyBytes);
  }

  async delete(key: string): Promise<void> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(deleteCommand);
  }

  // --- Multipart Upload ---

  async initiateMultipartUpload(
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<MultipartUploadInit> {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `${options.prefix}/${randomUUID()}-${sanitizedFileName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    const response = await this.s3Client.send(command);

    if (!response.UploadId) {
      throw new Error('Failed to initiate multipart upload');
    }

    return {
      uploadId: response.UploadId,
      key: objectKey,
    };
  }

  async getPresignedPartUrls(
    key: string,
    uploadId: string,
    totalParts: number,
  ): Promise<MultipartPartUrl[]> {
    const urls: MultipartPartUrl[] = [];

    for (let i = 1; i <= totalParts; i++) {
      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: i,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 hour
      });

      urls.push({ partNumber: i, url });
    }

    return urls;
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: MultipartCompletePart[],
  ): Promise<UploadResult> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((p) => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          })),
      },
    });

    await this.s3Client.send(command);

    const objectUrl = `${this.endpoint}/${this.bucket}/${key}`;

    return {
      key,
      url: objectUrl,
      size: 0, // Caller should set actual size
      mimeType: '', // Caller should set actual mimeType
    };
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    });

    await this.s3Client.send(command);
  }
}
