import { PlanLimitExceededError } from '@/@errors/use-cases/plan-limit-exceeded-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';
import type { ThumbnailService } from '@/services/storage/thumbnail-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadFileUseCase } from './upload-file';

const TENANT_ID = 'tenant-1';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let fileUploadService: FakeFileUploadService;
let sut: UploadFileUseCase;

describe('UploadFileUseCase', () => {
  beforeEach(async () => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();
    fileUploadService = new FakeFileUploadService();

    sut = new UploadFileUseCase(
      storageFoldersRepository,
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
    );

    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });
  });

  it('should upload a file to an existing folder', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('file content'),
        filename: 'report.pdf',
        mimetype: 'application/pdf',
      },
      uploadedBy: 'user-1',
    });

    expect(result.file.name).toBe('report.pdf');
    expect(result.file.originalName).toBe('report.pdf');
    expect(result.file.fileType).toBe('pdf');
    expect(result.file.mimeType).toBe('application/pdf');
    expect(result.file.currentVersion).toBe(1);
    expect(result.file.tenantId.toString()).toBe(TENANT_ID);
    expect(result.file.folderId?.toString()).toBe(folder.id.toString());
    expect(result.version.version).toBe(1);
    expect(result.version.changeNote).toBe('Initial upload');
  });

  it('should upload a file with entity binding', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('image data'),
        filename: 'product-photo.jpg',
        mimetype: 'image/jpeg',
      },
      entityType: 'product',
      entityId: 'product-123',
      uploadedBy: 'user-1',
    });

    expect(result.file.entityType).toBe('product');
    expect(result.file.entityId).toBe('product-123');
    expect(result.file.fileType).toBe('image');
  });

  it('should throw when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder',
        file: {
          buffer: Buffer.from('file content'),
          filename: 'report.pdf',
          mimetype: 'application/pdf',
        },
        uploadedBy: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should create initial version record', async () => {
    const folder = storageFoldersRepository.items[0];

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('spreadsheet data'),
        filename: 'data.xlsx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      uploadedBy: 'user-1',
    });

    expect(storageFileVersionsRepository.items).toHaveLength(1);
    expect(storageFileVersionsRepository.items[0].version).toBe(1);
    expect(storageFileVersionsRepository.items[0].uploadedBy).toBe('user-1');
  });

  it('should use the correct upload prefix', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('file content'),
        filename: 'doc.txt',
        mimetype: 'text/plain',
      },
      uploadedBy: 'user-1',
    });

    expect(result.file.fileKey).toContain(`storage/${TENANT_ID}/`);
    expect(result.file.fileKey).toContain(folder.id.toString());
  });

  it('should reject upload when storage quota is exceeded', async () => {
    const folder = storageFoldersRepository.items[0];

    // Upload a file first to consume some storage
    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.alloc(500), // 500 bytes
        filename: 'existing.pdf',
        mimetype: 'application/pdf',
      },
      uploadedBy: 'user-1',
    });

    // Try to upload another file that would exceed the 1KB quota
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        file: {
          buffer: Buffer.alloc(600), // 600 bytes, total would be 1100 > 1024
          filename: 'too-large.pdf',
          mimetype: 'application/pdf',
        },
        uploadedBy: 'user-1',
        maxStorageBytes: 1024, // 1KB limit
      }),
    ).rejects.toThrow(PlanLimitExceededError);
  });

  it('should allow upload when within storage quota', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.alloc(500),
        filename: 'small.pdf',
        mimetype: 'application/pdf',
      },
      uploadedBy: 'user-1',
      maxStorageBytes: 1024 * 1024, // 1MB limit, file is only 500 bytes
    });

    expect(result.file.name).toBe('small.pdf');
  });

  it('should skip quota check when maxStorageBytes is 0 (unlimited)', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.alloc(10000),
        filename: 'large.pdf',
        mimetype: 'application/pdf',
      },
      uploadedBy: 'user-1',
      maxStorageBytes: 0,
    });

    expect(result.file.name).toBe('large.pdf');
  });

  it('should set thumbnailKey when uploading an image with thumbnail service', async () => {
    const folder = storageFoldersRepository.items[0];

    const mockThumbnailService: ThumbnailService = {
      canGenerate: vi.fn().mockReturnValue(true),
      generate: vi.fn().mockResolvedValue({
        buffer: Buffer.from('thumbnail-data'),
        width: 200,
        height: 150,
        mimeType: 'image/jpeg',
      }),
    };

    const sutWithThumbnail = new UploadFileUseCase(
      storageFoldersRepository,
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
      mockThumbnailService,
    );

    const result = await sutWithThumbnail.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('image data'),
        filename: 'photo.jpg',
        mimetype: 'image/jpeg',
      },
      uploadedBy: 'user-1',
    });

    expect(mockThumbnailService.canGenerate).toHaveBeenCalledWith('image/jpeg');
    expect(mockThumbnailService.generate).toHaveBeenCalledWith(
      Buffer.from('image data'),
      'image/jpeg',
    );

    // The file should have a thumbnailKey set via repository update
    const updatedFile = storageFilesRepository.items[0];
    expect(updatedFile.thumbnailKey).toBeTruthy();
    expect(updatedFile.thumbnailKey).toContain('thumbnails');
    expect(updatedFile.thumbnailKey).toContain('thumb_photo.jpg');

    // The main upload should still succeed
    expect(result.file.name).toBe('photo.jpg');
    expect(result.file.fileType).toBe('image');
  });

  it('should not set thumbnailKey for non-image files', async () => {
    const folder = storageFoldersRepository.items[0];

    const mockThumbnailService: ThumbnailService = {
      canGenerate: vi.fn().mockReturnValue(false),
      generate: vi.fn(),
    };

    const sutWithThumbnail = new UploadFileUseCase(
      storageFoldersRepository,
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
      mockThumbnailService,
    );

    const result = await sutWithThumbnail.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('pdf content'),
        filename: 'document.pdf',
        mimetype: 'application/pdf',
      },
      uploadedBy: 'user-1',
    });

    expect(mockThumbnailService.canGenerate).toHaveBeenCalledWith(
      'application/pdf',
    );
    expect(mockThumbnailService.generate).not.toHaveBeenCalled();
    expect(result.file.thumbnailKey).toBeNull();
  });

  it('should not block upload when thumbnail generation fails', async () => {
    const folder = storageFoldersRepository.items[0];

    const mockThumbnailService: ThumbnailService = {
      canGenerate: vi.fn().mockReturnValue(true),
      generate: vi.fn().mockRejectedValue(new Error('Sharp failed')),
    };

    const sutWithThumbnail = new UploadFileUseCase(
      storageFoldersRepository,
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
      mockThumbnailService,
    );

    // Should not throw even though thumbnail generation fails
    const result = await sutWithThumbnail.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('corrupt image'),
        filename: 'broken.jpg',
        mimetype: 'image/jpeg',
      },
      uploadedBy: 'user-1',
    });

    expect(result.file.name).toBe('broken.jpg');
    expect(result.file.thumbnailKey).toBeNull();
  });

  it('should work without thumbnail service (backwards compatible)', async () => {
    const folder = storageFoldersRepository.items[0];

    // sut is created without thumbnailService in beforeEach
    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('image data'),
        filename: 'photo.jpg',
        mimetype: 'image/jpeg',
      },
      uploadedBy: 'user-1',
    });

    expect(result.file.name).toBe('photo.jpg');
    expect(result.file.thumbnailKey).toBeNull();
  });
});
