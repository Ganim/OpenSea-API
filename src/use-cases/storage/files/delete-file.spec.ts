import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteFileUseCase } from './delete-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: DeleteFileUseCase;

describe('DeleteFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new DeleteFileUseCase(storageFilesRepository);
  });

  it('should soft-delete a file', async () => {
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

    await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    const deletedFile = storageFilesRepository.items.find((item) =>
      item.id.equals(createdFile.id),
    );

    expect(deletedFile).toBeDefined();
    expect(deletedFile!.deletedAt).not.toBeNull();
    expect(deletedFile!.isDeleted).toBe(true);
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find soft-deleted file by id', async () => {
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

    await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    // findById should exclude soft-deleted files
    const foundFile = await storageFilesRepository.findById(
      createdFile.id,
      TENANT_ID,
    );

    expect(foundFile).toBeNull();
  });

  it('should throw when trying to delete a file from a different tenant', async () => {
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
