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

export interface FileUploadService {
  upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<UploadResult>;

  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;

  delete(key: string): Promise<void>;
}
