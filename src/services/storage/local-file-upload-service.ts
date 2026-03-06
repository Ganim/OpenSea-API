import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import type {
  FileUploadService,
  MultipartCompletePart,
  MultipartPartUrl,
  MultipartUploadInit,
  UploadOptions,
  UploadResult,
} from './file-upload-service';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOADS_BASE_DIR = resolve(process.cwd(), 'uploads');

export class LocalFileUploadService implements FileUploadService {
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
    const targetDirectory = join(UPLOADS_BASE_DIR, options.prefix);
    const absoluteFilePath = join(UPLOADS_BASE_DIR, objectKey);

    await mkdir(targetDirectory, { recursive: true });
    await writeFile(absoluteFilePath, fileBuffer);

    return {
      key: objectKey,
      url: `file://${absoluteFilePath}`,
      size: fileBuffer.length,
      mimeType,
    };
  }

  async getPresignedUrl(key: string, _expiresIn?: number): Promise<string> {
    const absoluteFilePath = join(UPLOADS_BASE_DIR, key);

    return `file://${absoluteFilePath}`;
  }

  async getObject(key: string): Promise<Buffer> {
    const absoluteFilePath = join(UPLOADS_BASE_DIR, key);
    return readFile(absoluteFilePath);
  }

  async delete(key: string): Promise<void> {
    const absoluteFilePath = join(UPLOADS_BASE_DIR, key);

    await unlink(absoluteFilePath);
  }

  // --- Multipart Upload (not supported in local dev, stubs only) ---

  async initiateMultipartUpload(
    _fileName: string,
    _mimeType: string,
    _options: UploadOptions,
  ): Promise<MultipartUploadInit> {
    throw new Error(
      'Multipart upload is not supported in local file storage. Use S3 for large file uploads.',
    );
  }

  async getPresignedPartUrls(
    _key: string,
    _uploadId: string,
    _totalParts: number,
  ): Promise<MultipartPartUrl[]> {
    throw new Error(
      'Multipart upload is not supported in local file storage. Use S3 for large file uploads.',
    );
  }

  async completeMultipartUpload(
    _key: string,
    _uploadId: string,
    _parts: MultipartCompletePart[],
  ): Promise<UploadResult> {
    throw new Error(
      'Multipart upload is not supported in local file storage. Use S3 for large file uploads.',
    );
  }

  async abortMultipartUpload(_key: string, _uploadId: string): Promise<void> {
    throw new Error(
      'Multipart upload is not supported in local file storage. Use S3 for large file uploads.',
    );
  }
}
