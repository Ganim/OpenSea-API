import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { DownloadFileUseCase } from './download-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let fileUploadService: FakeFileUploadService;
let sut: DownloadFileUseCase;

describe('DownloadFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();
    fileUploadService = new FakeFileUploadService();

    sut = new DownloadFileUseCase(
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
    );
  });

  it('should return a presigned URL for the current file version', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/folder-1/report.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    expect(result.url).toContain('storage/tenant-1/folder-1/report.pdf');
    expect(result.url).toContain('signed=true');
    expect(result.file.id.equals(createdFile.id)).toBe(true);
  });

  it('should return a presigned URL for a specific version', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/folder-1/report-v2.pdf',
      path: '/documents/report.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: createdFile.id.toString(),
      version: 1,
      fileKey: 'storage/tenant-1/folder-1/report-v1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: createdFile.id.toString(),
      version: 2,
      fileKey: 'storage/tenant-1/folder-1/report-v2.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      version: 1,
    });

    expect(result.url).toContain('report-v1.pdf');
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when requested version does not exist', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/folder-1/report.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: createdFile.id.toString(),
        version: 99,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
