import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RenameFileUseCase } from './rename-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: RenameFileUseCase;

describe('RenameFileUseCase', () => {
  beforeEach(async () => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();

    sut = new RenameFileUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );

    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });
  });

  it('should rename a file and update its path', async () => {
    const folder = storageFoldersRepository.items[0];

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'old-name.pdf',
      originalName: 'old-name.pdf',
      fileKey: 'storage/tenant-1/folder-1/old-name.pdf',
      path: '/documents/old-name.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      name: 'New Report Name',
    });

    expect(result.file.name).toBe('New Report Name');
    expect(result.file.path).toContain('new-report-name');
  });

  it('should throw when file name is empty', async () => {
    const folder = storageFoldersRepository.items[0];

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
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
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
        name: 'New Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should trim whitespace from the new name', async () => {
    const folder = storageFoldersRepository.items[0];

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
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
      name: '  Trimmed Name  ',
    });

    expect(result.file.name).toBe('Trimmed Name');
  });
});
