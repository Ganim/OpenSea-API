import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { ListFolderContentsUseCase } from './list-folder-contents';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: ListFolderContentsUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('ListFolderContentsUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new ListFolderContentsUseCase(
      storageFoldersRepository,
      storageFilesRepository,
    );
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should list root folders when no folderId is provided', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Images',
    });

    const { folders, total } = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(folders).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should list child folders of a specific folder', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Invoices',
      parentId: parentFolder.id.toString(),
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Reports',
      parentId: parentFolder.id.toString(),
    });

    const { folders, total } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    expect(folders).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should list files in a folder', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    // Add files directly via the repository
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'files/report.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const { files, total } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('report.pdf');
    expect(total).toBe(1);
  });

  it('should return both folders and files', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Subfolder',
      parentId: parentFolder.id.toString(),
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
      name: 'file.txt',
      originalName: 'file.txt',
      fileKey: 'files/file.txt',
      path: '/documents/file.txt',
      size: 256,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const { folders, files, total } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
    });

    expect(folders).toHaveLength(1);
    expect(files).toHaveLength(1);
    expect(total).toBe(2);
  });

  it('should filter folders and files by search term', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Invoices',
      parentId: parentFolder.id.toString(),
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Reports',
      parentId: parentFolder.id.toString(),
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
      search: 'invoice',
    });

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe('Invoices');
  });

  it('should return empty results for empty folder', async () => {
    const { folder: emptyFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Empty Folder',
    });

    const { folders, files, total } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: emptyFolder.id.toString(),
    });

    expect(folders).toHaveLength(0);
    expect(files).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('should throw error if folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return empty results for root level when no folders exist', async () => {
    const { folders, files, total } = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(folders).toHaveLength(0);
    expect(files).toHaveLength(0);
    expect(total).toBe(0);
  });
});
