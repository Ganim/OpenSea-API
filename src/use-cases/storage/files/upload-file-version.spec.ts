import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import type {
  FileUploadService,
  UploadResult,
} from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { UploadFileVersionUseCase } from './upload-file-version';

const TENANT_ID = 'tenant-1';

class FakeFileUploadService implements FileUploadService {
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

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let fileUploadService: FakeFileUploadService;
let sut: UploadFileVersionUseCase;

describe('UploadFileVersionUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();
    fileUploadService = new FakeFileUploadService();

    sut = new UploadFileVersionUseCase(
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
    );
  });

  it('should upload a new version of an existing file', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/folder-1/report-v1.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      file: {
        buffer: Buffer.from('updated content'),
        filename: 'report-v2.pdf',
        mimetype: 'application/pdf',
      },
      changeNote: 'Updated with new data',
      uploadedBy: 'user-2',
    });

    expect(result.file.currentVersion).toBe(2);
    expect(result.version.version).toBe(2);
    expect(result.version.changeNote).toBe('Updated with new data');
    expect(result.version.uploadedBy).toBe('user-2');
  });

  it('should increment version number correctly for multiple uploads', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'data.xlsx',
      originalName: 'data.xlsx',
      fileKey: 'storage/tenant-1/folder-1/data-v1.xlsx',
      path: '/documents/data.xlsx',
      size: 512,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileType: 'spreadsheet',
      uploadedBy: 'user-1',
    });

    // Upload version 2
    await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      file: {
        buffer: Buffer.from('v2 content'),
        filename: 'data-v2.xlsx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      uploadedBy: 'user-1',
    });

    // Upload version 3
    const resultV3 = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      file: {
        buffer: Buffer.from('v3 content'),
        filename: 'data-v3.xlsx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      uploadedBy: 'user-1',
    });

    expect(resultV3.file.currentVersion).toBe(3);
    expect(resultV3.version.version).toBe(3);
    expect(storageFileVersionsRepository.items).toHaveLength(2);
  });

  it('should update the file fileKey, size and mimeType', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'photo.jpg',
      originalName: 'photo.jpg',
      fileKey: 'storage/tenant-1/folder-1/photo-v1.jpg',
      path: '/documents/photo.jpg',
      size: 4096,
      mimeType: 'image/jpeg',
      fileType: 'image',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      file: {
        buffer: Buffer.from('new png content'),
        filename: 'photo-v2.png',
        mimetype: 'image/png',
      },
      uploadedBy: 'user-1',
    });

    expect(result.file.mimeType).toBe('image/png');
    expect(result.file.fileKey).toContain('photo-v2.png');
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
        file: {
          buffer: Buffer.from('content'),
          filename: 'file.txt',
          mimetype: 'text/plain',
        },
        uploadedBy: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should create a version without a change note', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'document.docx',
      originalName: 'document.docx',
      fileKey: 'storage/tenant-1/folder-1/document.docx',
      path: '/documents/document.docx',
      size: 2048,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'document',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      file: {
        buffer: Buffer.from('updated doc'),
        filename: 'document-v2.docx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      uploadedBy: 'user-1',
    });

    expect(result.version.changeNote).toBeNull();
  });
});
