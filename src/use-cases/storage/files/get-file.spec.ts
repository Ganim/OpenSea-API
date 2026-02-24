import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetFileUseCase } from './get-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let sut: GetFileUseCase;

describe('GetFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();

    sut = new GetFileUseCase(
      storageFilesRepository,
      storageFileVersionsRepository,
    );
  });

  it('should return a file with its versions', async () => {
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
    });

    expect(result.file.name).toBe('report.pdf');
    expect(result.versions).toHaveLength(2);
  });

  it('should return a file with empty versions if none exist', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'new-file.txt',
      originalName: 'new-file.txt',
      fileKey: 'storage/tenant-1/folder-1/new-file.txt',
      path: '/documents/new-file.txt',
      size: 512,
      mimeType: 'text/plain',
      fileType: 'other',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    expect(result.file.name).toBe('new-file.txt');
    expect(result.versions).toHaveLength(0);
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when file belongs to a different tenant', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: 'other-tenant',
      folderId: 'folder-1',
      name: 'private.pdf',
      originalName: 'private.pdf',
      fileKey: 'storage/other-tenant/folder-1/private.pdf',
      path: '/documents/private.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: createdFile.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
