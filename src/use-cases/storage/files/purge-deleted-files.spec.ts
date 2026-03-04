import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import type {
  FileUploadService,
  UploadResult,
} from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurgeDeletedFilesUseCase } from './purge-deleted-files';

const TENANT_ID = 'tenant-1';

class FakeFileUploadService implements FileUploadService {
  public deletedKeys: string[] = [];

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

  async delete(key: string): Promise<void> {
    this.deletedKeys.push(key);
  }

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
let sut: PurgeDeletedFilesUseCase;

describe('PurgeDeletedFilesUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();
    fileUploadService = new FakeFileUploadService();
    sut = new PurgeDeletedFilesUseCase(
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
    );
  });

  it('should purge soft-deleted files older than retention period', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'old-doc.pdf',
      originalName: 'old-doc.pdf',
      fileKey: 'storage/tenant-1/folder-1/old-doc.pdf',
      path: '/docs/old-doc.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: file.id.toString(),
      version: 1,
      fileKey: 'storage/tenant-1/folder-1/old-doc.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    // Soft-delete the file and backdate the deletedAt
    await storageFilesRepository.softDelete(file.id);
    file.deletedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago

    const result = await sut.execute({ retentionDays: 30 });

    expect(result.purgedFiles).toBe(1);
    expect(result.purgedVersions).toBe(1);
    expect(result.freedBytes).toBe(2048);
    expect(result.errors).toBe(0);

    // File should be hard-deleted
    expect(storageFilesRepository.items).toHaveLength(0);

    // Versions should be deleted
    expect(storageFileVersionsRepository.items).toHaveLength(0);

    // Physical file should be deleted
    expect(fileUploadService.deletedKeys).toContain(
      'storage/tenant-1/folder-1/old-doc.pdf',
    );
  });

  it('should NOT purge files within retention period', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'recent.pdf',
      originalName: 'recent.pdf',
      fileKey: 'storage/tenant-1/folder-1/recent.pdf',
      path: '/docs/recent.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    // Soft-delete but keep within retention (only 5 days ago)
    await storageFilesRepository.softDelete(file.id);
    file.deletedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const result = await sut.execute({ retentionDays: 30 });

    expect(result.purgedFiles).toBe(0);
    // File still in items (soft-deleted but not purged)
    expect(storageFilesRepository.items).toHaveLength(1);
  });

  it('should purge multiple versions of the same file', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'multi-version.pdf',
      originalName: 'multi-version.pdf',
      fileKey: 'storage/tenant-1/folder-1/multi-version-v2.pdf',
      path: '/docs/multi-version.pdf',
      size: 3072,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: file.id.toString(),
      version: 1,
      fileKey: 'storage/tenant-1/folder-1/multi-version-v1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: file.id.toString(),
      version: 2,
      fileKey: 'storage/tenant-1/folder-1/multi-version-v2.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.softDelete(file.id);
    file.deletedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

    const result = await sut.execute({ retentionDays: 30 });

    expect(result.purgedFiles).toBe(1);
    expect(result.purgedVersions).toBe(2);
    expect(result.freedBytes).toBe(3072); // 1024 + 2048
    expect(fileUploadService.deletedKeys).toHaveLength(2);
  });

  it('should respect batchSize limit', async () => {
    // Create 3 soft-deleted files
    for (let i = 0; i < 3; i++) {
      const file = await storageFilesRepository.create({
        tenantId: TENANT_ID,
        folderId: 'folder-1',
        name: `file-${i}.txt`,
        originalName: `file-${i}.txt`,
        fileKey: `storage/tenant-1/folder-1/file-${i}.txt`,
        path: `/docs/file-${i}.txt`,
        size: 512,
        mimeType: 'text/plain',
        fileType: 'DOCUMENT',
        uploadedBy: 'user-1',
      });

      await storageFileVersionsRepository.create({
        fileId: file.id.toString(),
        version: 1,
        fileKey: `storage/tenant-1/folder-1/file-${i}.txt`,
        size: 512,
        mimeType: 'text/plain',
        uploadedBy: 'user-1',
      });

      await storageFilesRepository.softDelete(file.id);
      file.deletedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    }

    const result = await sut.execute({ retentionDays: 30, batchSize: 2 });

    expect(result.purgedFiles).toBe(2);
    // 1 file remains
    expect(storageFilesRepository.items).toHaveLength(1);
  });

  it('should count errors without stopping execution', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'error-file.pdf',
      originalName: 'error-file.pdf',
      fileKey: 'storage/tenant-1/folder-1/error-file.pdf',
      path: '/docs/error-file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: file.id.toString(),
      version: 1,
      fileKey: 'storage/tenant-1/folder-1/error-file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.softDelete(file.id);
    file.deletedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

    // Make file upload service throw on delete
    vi.spyOn(fileUploadService, 'delete').mockRejectedValue(
      new Error('S3 unavailable'),
    );

    const result = await sut.execute({ retentionDays: 30 });

    // Physical delete failed but DB records should still be cleaned
    expect(result.errors).toBe(1);
    // File itself should still be purged from DB despite version delete error
    expect(result.purgedFiles).toBe(1);
  });

  it('should not purge active files', async () => {
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'active.pdf',
      originalName: 'active.pdf',
      fileKey: 'storage/tenant-1/folder-1/active.pdf',
      path: '/docs/active.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({ retentionDays: 30 });

    expect(result.purgedFiles).toBe(0);
    expect(storageFilesRepository.items).toHaveLength(1);
  });
});
