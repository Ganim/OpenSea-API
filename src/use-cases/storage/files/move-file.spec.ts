import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { MoveFileUseCase } from './move-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: MoveFileUseCase;

describe('MoveFileUseCase', () => {
  beforeEach(async () => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();

    sut = new MoveFileUseCase(storageFilesRepository, storageFoldersRepository);

    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });

    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Archives',
      slug: 'archives',
      path: '/archives',
    });
  });

  it('should move a file to a different folder', async () => {
    const sourceFolder = storageFoldersRepository.items[0];
    const targetFolder = storageFoldersRepository.items[1];

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: sourceFolder.id.toString(),
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
      targetFolderId: targetFolder.id.toString(),
    });

    expect(result.file.folderId?.toString()).toBe(targetFolder.id.toString());
    expect(result.file.path).toContain('archives');
  });

  it('should throw when file does not exist', async () => {
    const targetFolder = storageFoldersRepository.items[1];

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
        targetFolderId: targetFolder.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when target folder does not exist', async () => {
    const sourceFolder = storageFoldersRepository.items[0];

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: sourceFolder.id.toString(),
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
        targetFolderId: 'non-existent-folder',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when a file with the same name exists in the target folder', async () => {
    const sourceFolder = storageFoldersRepository.items[0];
    const targetFolder = storageFoldersRepository.items[1];

    const fileInSource = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: sourceFolder.id.toString(),
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/source/report.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    // Create file with same name (same resulting path) in target folder
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: targetFolder.id.toString(),
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/target/report.pdf',
      path: '/archives/report.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-2',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: fileInSource.id.toString(),
        targetFolderId: targetFolder.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
