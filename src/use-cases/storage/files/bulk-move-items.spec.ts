import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { CreateFolderUseCase } from '@/use-cases/storage/folders/create-folder';
import { beforeEach, describe, expect, it } from 'vitest';
import { BulkMoveItemsUseCase } from './bulk-move-items';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: BulkMoveItemsUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('BulkMoveItemsUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new BulkMoveItemsUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should throw when no items are provided', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Target',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        targetFolderId: folder.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when target folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileIds: ['some-file-id'],
        targetFolderId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should move multiple files to target folder', async () => {
    const { folder: source } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Source',
    });

    const { folder: target } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Target',
    });

    const file1 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: source.id.toString(),
      name: 'file1.pdf',
      originalName: 'file1.pdf',
      fileKey: 'files/file1.pdf',
      path: '/source/file1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const file2 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: source.id.toString(),
      name: 'file2.txt',
      originalName: 'file2.txt',
      fileKey: 'files/file2.txt',
      path: '/source/file2.txt',
      size: 512,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [file1.id.toString(), file2.id.toString()],
      targetFolderId: target.id.toString(),
    });

    expect(result.movedFiles).toBe(2);
    expect(result.errors).toHaveLength(0);

    const movedFile1 = storageFilesRepository.items.find((f) =>
      f.id.equals(file1.id),
    );
    expect(movedFile1?.folderId?.toString()).toBe(target.id.toString());
  });

  it('should move a folder with cascade', async () => {
    const { folder: folderA } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder A',
    });

    const { folder: target } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Target',
    });

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folderA.id.toString(),
      name: 'doc.pdf',
      originalName: 'doc.pdf',
      fileKey: 'files/doc.pdf',
      path: '/folder-a/doc.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderIds: [folderA.id.toString()],
      targetFolderId: target.id.toString(),
    });

    expect(result.movedFolders).toBe(1);
    expect(result.errors).toHaveLength(0);

    const movedFile = storageFilesRepository.items.find((f) =>
      f.id.equals(file.id),
    );
    expect(movedFile?.path).toBe('/target/folder-a/doc.pdf');
  });

  it('should skip system folders and report errors', async () => {
    const systemFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'System',
      slug: 'system',
      path: '/system',
      isSystem: true,
    });

    const { folder: target } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Target',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderIds: [systemFolder.id.toString()],
      targetFolderId: target.id.toString(),
    });

    expect(result.movedFolders).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('System folder');
  });

  it('should handle mixed files and folders', async () => {
    const { folder: source } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Source',
    });

    const { folder: folderToMove } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Moveable',
      parentId: source.id.toString(),
    });

    const { folder: target } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Target',
    });

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: source.id.toString(),
      name: 'file.txt',
      originalName: 'file.txt',
      fileKey: 'files/file.txt',
      path: '/source/file.txt',
      size: 100,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [file.id.toString()],
      folderIds: [folderToMove.id.toString()],
      targetFolderId: target.id.toString(),
    });

    expect(result.movedFiles).toBe(1);
    expect(result.movedFolders).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should report error for non-existent file ids', async () => {
    const { folder: target } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Target',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: ['non-existent-id'],
      targetFolderId: target.id.toString(),
    });

    expect(result.movedFiles).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('not found');
  });
});
