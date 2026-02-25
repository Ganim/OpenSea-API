import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from '../folders/create-folder';
import { RestoreFileUseCase } from './restore-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let createFolder: CreateFolderUseCase;
let sut: RestoreFileUseCase;

describe('RestoreFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
    sut = new RestoreFileUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
  });

  it('should restore a deleted file', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/documents/report.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    // Soft-delete the file
    await storageFilesRepository.softDelete(createdFile.id);

    // Verify it's deleted
    const deletedFile = await storageFilesRepository.findById(
      createdFile.id,
      TENANT_ID,
    );
    expect(deletedFile).toBeNull();

    // Restore the file
    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    expect(result.file).toBeDefined();
    expect(result.file.deletedAt).toBeNull();

    // File should be findable again
    const restoredFile = await storageFilesRepository.findById(
      createdFile.id,
      TENANT_ID,
    );
    expect(restoredFile).not.toBeNull();
    expect(restoredFile!.name).toBe('report.pdf');
  });

  it('should throw when file not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should move file to root when parent folder is deleted', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Temp Folder',
    });

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'orphaned-file.pdf',
      originalName: 'orphaned-file.pdf',
      fileKey: 'storage/tenant-1/temp-folder/orphaned-file.pdf',
      path: '/temp-folder/orphaned-file.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    // Soft-delete both the file and its parent folder
    await storageFilesRepository.softDelete(createdFile.id);
    await storageFoldersRepository.softDelete(folder.id);

    // Restore the file (parent folder is still deleted)
    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    // File should be restored but moved to root
    expect(result.file).toBeDefined();
    expect(result.file.folderId).toBeNull();
    expect(result.file.path).toBe('/orphaned-file-pdf');
  });
});
