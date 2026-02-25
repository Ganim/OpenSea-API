import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from '../folders/create-folder';
import { ListDeletedItemsUseCase } from './list-deleted-items';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let createFolder: CreateFolderUseCase;
let sut: ListDeletedItemsUseCase;

describe('ListDeletedItemsUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
    sut = new ListDeletedItemsUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
  });

  it('should list deleted files and folders', async () => {
    // Create and delete a folder
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Deleted Folder',
    });
    await storageFoldersRepository.softDelete(folder.id);

    // Create and delete a file
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'deleted-file.pdf',
      originalName: 'deleted-file.pdf',
      fileKey: 'storage/tenant-1/deleted-file.pdf',
      path: '/deleted-file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(createdFile.id);

    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.files).toHaveLength(1);
    expect(result.folders).toHaveLength(1);
    expect(result.totalFiles).toBe(1);
    expect(result.totalFolders).toBe(1);
    expect(result.files[0].name).toBe('deleted-file.pdf');
    expect(result.folders[0].name).toBe('Deleted Folder');
  });

  it('should return empty when nothing is deleted', async () => {
    // Create active items (not deleted)
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Active Folder',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'active-file.pdf',
      originalName: 'active-file.pdf',
      fileKey: 'storage/tenant-1/active-file.pdf',
      path: '/active-file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.files).toHaveLength(0);
    expect(result.folders).toHaveLength(0);
    expect(result.totalFiles).toBe(0);
    expect(result.totalFolders).toBe(0);
  });
});
