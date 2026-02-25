export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  prefix: string;
  maxSize?: number; // bytes, default 10MB
  allowedTypes?: string[];
}

export interface MultipartUploadInit {
  uploadId: string;
  key: string;
}

export interface MultipartPartUrl {
  partNumber: number;
  url: string;
}

export interface MultipartCompletePart {
  partNumber: number;
  etag: string;
}

export interface FileUploadService {
  upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<UploadResult>;

  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;

  getObject(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  // Multipart upload (for files > 50MB)
  initiateMultipartUpload(
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<MultipartUploadInit>;

  getPresignedPartUrls(
    key: string,
    uploadId: string,
    totalParts: number,
  ): Promise<MultipartPartUrl[]>;

  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: MultipartCompletePart[],
  ): Promise<UploadResult>;

  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
}
