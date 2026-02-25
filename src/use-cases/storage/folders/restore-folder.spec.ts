import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { DeleteFolderUseCase } from './delete-folder';
import { RestoreFolderUseCase } from './restore-folder';

const TENANT_ID = 'tenant-1';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let createFolder: CreateFolderUseCase;
let deleteFolder: DeleteFolderUseCase;
let sut: RestoreFolderUseCase;

describe('RestoreFolderUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
    deleteFolder = new DeleteFolderUseCase(
      storageFoldersRepository,
      storageFilesRepository,
    );
    sut = new RestoreFolderUseCase(
      storageFoldersRepository,
      storageFilesRepository,
    );
  });

  it('should restore a deleted folder', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    // Delete the folder
    await deleteFolder.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    // Verify it's deleted
    const deletedFolder = await storageFoldersRepository.findById(
      folder.id,
      TENANT_ID,
    );
    expect(deletedFolder).toBeNull();

    // Restore the folder
    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    expect(result.folder).toBeDefined();
    expect(result.folder.deletedAt).toBeNull();

    // Folder should be findable again
    const restoredFolder = await storageFoldersRepository.findById(
      folder.id,
      TENANT_ID,
    );
    expect(restoredFolder).not.toBeNull();
    expect(restoredFolder!.name).toBe('Documents');
  });

  it('should throw when folder not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should restore descendant folders and files', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    // Create a file in the child folder
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
      name: 'nested-file.txt',
      originalName: 'nested-file.txt',
      fileKey: 'files/nested-file.txt',
      path: '/parent/child/nested-file.txt',
      size: 512,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    // Delete the parent folder (cascades to child folder and files)
    await deleteFolder.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    // Verify everything is deleted
    expect(
      await storageFoldersRepository.findById(childFolder.id, TENANT_ID),
    ).toBeNull();
    expect(
      await storageFilesRepository.findById(createdFile.id, TENANT_ID),
    ).toBeNull();

    // Restore the parent folder
    await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    // Child folder should be restored
    const restoredChild = await storageFoldersRepository.findById(
      childFolder.id,
      TENANT_ID,
    );
    expect(restoredChild).not.toBeNull();
    expect(restoredChild!.name).toBe('Child');

    // File in child folder should be restored
    const restoredFile = await storageFilesRepository.findById(
      createdFile.id,
      TENANT_ID,
    );
    expect(restoredFile).not.toBeNull();
    expect(restoredFile!.name).toBe('nested-file.txt');
  });

  it('should move folder to root when parent is deleted', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    // Delete both folders
    await deleteFolder.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    // Restore only the child folder (parent stays deleted)
    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
    });

    // Child folder should be moved to root since parent is still deleted
    expect(result.folder.parentId).toBeNull();
    expect(result.folder.path).toBe('/child');
    expect(result.folder.depth).toBe(0);
  });
});
