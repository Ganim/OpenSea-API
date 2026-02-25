import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { DeleteFolderUseCase } from './delete-folder';
import { GetFolderUseCase } from './get-folder';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: DeleteFolderUseCase;
let createFolder: CreateFolderUseCase;
let getFolder: GetFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('DeleteFolderUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new DeleteFolderUseCase(
      storageFoldersRepository,
      storageFilesRepository,
    );
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
    getFolder = new GetFolderUseCase(storageFoldersRepository);
  });

  it('should soft-delete a folder', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'To Delete',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    // Folder should not be findable anymore (soft-deleted)
    await expect(
      getFolder.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should recursively soft-delete descendant folders', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    const { folder: grandchildFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Grandchild',
      parentId: childFolder.id.toString(),
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    // All descendants should be soft-deleted
    await expect(
      getFolder.execute({
        tenantId: TENANT_ID,
        folderId: childFolder.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);

    await expect(
      getFolder.execute({
        tenantId: TENANT_ID,
        folderId: grandchildFolder.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should soft-delete files in the folder', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder With Files',
    });

    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'document.pdf',
      originalName: 'document.pdf',
      fileKey: 'files/document.pdf',
      path: '/folder-with-files/document.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    // File should be soft-deleted
    const deletedFile = await storageFilesRepository.findById(
      createdFile.id,
      TENANT_ID,
    );
    expect(deletedFile).toBeNull();
  });

  it('should soft-delete files in descendant folders', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

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

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    // File in child folder should be soft-deleted
    const deletedFile = await storageFilesRepository.findById(
      createdFile.id,
      TENANT_ID,
    );
    expect(deletedFile).toBeNull();
  });

  it('should not delete a system folder', async () => {
    const systemFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'System Folder',
      slug: 'system-folder',
      path: '/system-folder',
      isSystem: true,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: systemFolder.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error if folder not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should soft-delete all files even when folder has more than 20 files', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Many Files',
    });

    // Create 25 files (more than the default pagination limit of 20)
    const fileCount = 25;
    for (let i = 0; i < fileCount; i++) {
      await storageFilesRepository.create({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        name: `file-${i}.txt`,
        originalName: `file-${i}.txt`,
        fileKey: `files/file-${i}.txt`,
        path: `/many-files/file-${i}.txt`,
        size: 100,
        mimeType: 'text/plain',
        fileType: 'DOCUMENT',
        uploadedBy: 'user-1',
      });
    }

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    // ALL 25 files should be soft-deleted, not just the first 20
    const remainingFiles = storageFilesRepository.items.filter(
      (item) => item.deletedAt === null,
    );
    expect(remainingFiles).toHaveLength(0);
  });
});
