import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
// zlib imported dynamically in upload() to use async gzip

import { env } from '@/@env';

import type {
  FileUploadService,
  HeadObjectResult,
  MultipartCompletePart,
  MultipartPartUrl,
  MultipartUploadInit,
  UploadOptions,
  UploadResult,
  UploadWithKeyOptions,
  UploadWithKeyResult,
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
      const { promisify } = await import('node:util');
      const { gzip } = await import('node:zlib');
      const gzipAsync = promisify(gzip);
      const compressed = await gzipAsync(fileBuffer);
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

  /**
   * Deterministic-key upload — caller controls the exact `Key` used in S3.
   *
   * Used by Phase 06 compliance flows to keep `ComplianceArtifact.storageKey`
   * in lockstep with the blob path. Skips gzip compression unconditionally:
   * compliance buffers must hash byte-for-byte to `contentHash` recorded in
   * the row, so any encoding transformation would break the integrity audit.
   *
   * @param fileBuffer Raw bytes to upload.
   * @param key Exact S3 object key (no UUID/sanitization applied).
   * @param options mimeType is required; cacheControl + metadata optional.
   * @returns key + bucket + etag + size (etag is the S3-side hash, not our hash).
   */
  async uploadWithKey(
    fileBuffer: Buffer,
    key: string,
    options: UploadWithKeyOptions,
  ): Promise<UploadWithKeyResult> {
    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: options.mimeType,
      CacheControl: options.cacheControl,
      Metadata: options.metadata,
    });

    const response = await this.s3Client.send(putCommand);

    return {
      key,
      bucket: this.bucket,
      etag: response.ETag,
      size: fileBuffer.length,
    };
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = DEFAULT_PRESIGNED_URL_EXPIRATION,
    responseContentDisposition?: string,
  ): Promise<string> {
    // Cache key includes the disposition so that requests with different
    // filenames produce distinct signed URLs (the query string changes the
    // signature — sharing a cache entry would serve the wrong filename).
    const cacheKey = `${key}:${expiresIn}:${responseContentDisposition ?? ''}`;
    const cached = this.presignedUrlCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      // AWS SDK serializes this as `response-content-disposition` in the
      // presigned URL query string. The signature covers it, so browsers
      // cannot tamper with the filename.
      ResponseContentDisposition: responseContentDisposition,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn,
    });

    // Evict expired + oldest entries if cache is full
    if (this.presignedUrlCache.size >= PRESIGNED_URL_CACHE_MAX) {
      const now = Date.now();
      // First pass: remove all expired entries
      for (const [k, v] of this.presignedUrlCache) {
        if (v.expiresAt <= now) this.presignedUrlCache.delete(k);
      }
      // If still over limit, remove oldest 10% via FIFO
      if (this.presignedUrlCache.size >= PRESIGNED_URL_CACHE_MAX) {
        const toRemove = Math.max(1, Math.floor(PRESIGNED_URL_CACHE_MAX * 0.1));
        let removed = 0;
        for (const k of this.presignedUrlCache.keys()) {
          if (removed >= toRemove) break;
          this.presignedUrlCache.delete(k);
          removed++;
        }
      }
    }

    // WR-07: limita o TTL do cache pelo `expiresIn` real da URL (com 60s de
    // folga). Antes o cache retinha URLs com `expiresIn=900` (15 min) por até
    // 50 min, servindo-as do cache após expirar no S3/R2 e causando 403.
    const cacheTtl = Math.min(
      Math.max(0, expiresIn - 60) * 1000, // expiresIn em segundos → ms, -60s folga
      PRESIGNED_URL_CACHE_TTL,
    );
    this.presignedUrlCache.set(cacheKey, {
      url: presignedUrl,
      expiresAt: Date.now() + cacheTtl,
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

  async headObject(key: string): Promise<HeadObjectResult | null> {
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      // AWS SDK retorna undefined para campos ausentes — normalizamos para 0/''
      // mas o caller (ResolvePunchApprovalUseCase) deve usar apenas contentLength
      // para setar `EvidenceFile.size` real.
      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType ?? '',
      };
    } catch (err) {
      // R2/S3 devolvem 404 como `NotFound`/`NoSuchKey`; qualquer outra falha
      // (rede, credenciais) propaga para o caller decidir (log + 5xx).
      const name = (
        err as { name?: string; $metadata?: { httpStatusCode?: number } }
      )?.name;
      const status = (err as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) {
        return null;
      }
      throw err;
    }
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
    const promises = Array.from({ length: totalParts }, async (_, idx) => {
      const partNumber = idx + 1;
      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 hour
      });

      return { partNumber, url };
    });

    return Promise.all(promises);
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

  // Singleton instance — preserves presigned URL cache across requests
  private static instance: S3FileUploadService | null = null;

  static getInstance(): S3FileUploadService {
    if (!S3FileUploadService.instance) {
      S3FileUploadService.instance = new S3FileUploadService();
    }
    return S3FileUploadService.instance;
  }
}
