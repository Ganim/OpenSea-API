import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { CreateFolderUseCase } from '@/use-cases/storage/folders/create-folder';
import { beforeEach, describe, expect, it } from 'vitest';
import { BulkDeleteItemsUseCase } from './bulk-delete-items';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: BulkDeleteItemsUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('BulkDeleteItemsUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new BulkDeleteItemsUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should throw when no items are provided', async () => {
    await expect(sut.execute({ tenantId: TENANT_ID })).rejects.toThrow(
      BadRequestError,
    );
  });

  it('should soft-delete multiple files', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder',
    });

    const file1 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'file1.pdf',
      originalName: 'file1.pdf',
      fileKey: 'files/file1.pdf',
      path: '/folder/file1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const file2 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'file2.txt',
      originalName: 'file2.txt',
      fileKey: 'files/file2.txt',
      path: '/folder/file2.txt',
      size: 512,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [file1.id.toString(), file2.id.toString()],
    });

    expect(result.deletedFiles).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Files should be soft-deleted (not findable)
    const found1 = await storageFilesRepository.findById(file1.id, TENANT_ID);
    const found2 = await storageFilesRepository.findById(file2.id, TENANT_ID);
    expect(found1).toBeNull();
    expect(found2).toBeNull();
  });

  it('should delete folder with cascade to files', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'To Delete',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'file.pdf',
      originalName: 'file.pdf',
      fileKey: 'files/file.pdf',
      path: '/to-delete/file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderIds: [folder.id.toString()],
    });

    expect(result.deletedFolders).toBe(1);
    expect(result.deletedFiles).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should delete folder with descendants and their files', async () => {
    const { folder: parent } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: child } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parent.id.toString(),
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: parent.id.toString(),
      name: 'parent-file.txt',
      originalName: 'parent-file.txt',
      fileKey: 'files/parent-file.txt',
      path: '/parent/parent-file.txt',
      size: 100,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: child.id.toString(),
      name: 'child-file.txt',
      originalName: 'child-file.txt',
      fileKey: 'files/child-file.txt',
      path: '/parent/child/child-file.txt',
      size: 100,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderIds: [parent.id.toString()],
    });

    expect(result.deletedFolders).toBe(2); // parent + child
    expect(result.deletedFiles).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('should skip system folders and report errors', async () => {
    const systemFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'System',
      slug: 'system',
      path: '/system',
      isSystem: true,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderIds: [systemFolder.id.toString()],
    });

    expect(result.deletedFolders).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('System folder');
  });

  it('should handle mixed files and folders', async () => {
    const { folder: folderToDelete } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Delete Me',
    });

    const { folder: otherFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Other',
    });

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: otherFolder.id.toString(),
      name: 'loose-file.txt',
      originalName: 'loose-file.txt',
      fileKey: 'files/loose-file.txt',
      path: '/other/loose-file.txt',
      size: 100,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [file.id.toString()],
      folderIds: [folderToDelete.id.toString()],
    });

    expect(result.deletedFiles).toBe(1);
    expect(result.deletedFolders).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should report error for non-existent items', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: ['non-existent-file'],
      folderIds: ['non-existent-folder'],
    });

    expect(result.deletedFiles).toBe(0);
    expect(result.deletedFolders).toBe(0);
    expect(result.errors).toHaveLength(2);
  });
});
