import type {
  FileUploadService,
  UploadResult,
} from '@/services/storage/file-upload-service';

export class FakeFileUploadService implements FileUploadService {
  async upload(
    _fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: { prefix: string },
  ): Promise<UploadResult> {
    return {
      key: `${options.prefix}/${fileName}`,
      url: `https://fake-storage.example.com/${options.prefix}/${fileName}`,
      size: _fileBuffer.length,
      mimeType,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    return `https://fake-storage.example.com/${key}?signed=true`;
  }

  async delete(_key: string): Promise<void> {}

  async getObject(_key: string): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  async initiateMultipartUpload(
    _fileName: string,
    _mimeType: string,
    _options: { prefix: string },
  ) {
    return { uploadId: 'test-upload-id', key: 'test-key' };
  }

  async getPresignedPartUrls(
    _key: string,
    _uploadId: string,
    _totalParts: number,
  ) {
    return [];
  }

  async completeMultipartUpload(
    _key: string,
    _uploadId: string,
    _parts: { partNumber: number; etag: string }[],
  ): Promise<UploadResult> {
    return {
      key: _key,
      url: `https://fake-storage.example.com/${_key}`,
      size: 0,
      mimeType: 'application/octet-stream',
    };
  }

  async abortMultipartUpload(_key: string, _uploadId: string): Promise<void> {}
}
