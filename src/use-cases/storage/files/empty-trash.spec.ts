import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateFolderUseCase } from '../folders/create-folder';
import { EmptyTrashUseCase } from './empty-trash';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let fakeFileUploadService: FileUploadService;
let createFolder: CreateFolderUseCase;
let sut: EmptyTrashUseCase;

describe('EmptyTrashUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    fakeFileUploadService = {
      upload: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      getObject: vi.fn(),
      getPresignedUrl: vi.fn(),
    } as unknown as FileUploadService;
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
    sut = new EmptyTrashUseCase(
      storageFilesRepository,
      storageFoldersRepository,
      fakeFileUploadService,
    );
  });

  it('should hard delete all soft-deleted items', async () => {
    // Create and soft-delete a folder
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'To Delete',
    });
    await storageFoldersRepository.softDelete(folder.id);

    // Create and soft-delete files
    const file1 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'trash-file-1.pdf',
      originalName: 'trash-file-1.pdf',
      fileKey: 'storage/tenant-1/trash-file-1.pdf',
      path: '/trash-file-1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(file1.id);

    const file2 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'trash-file-2.txt',
      originalName: 'trash-file-2.txt',
      fileKey: 'storage/tenant-1/trash-file-2.txt',
      path: '/trash-file-2.txt',
      size: 512,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(file2.id);

    // Also create an active file that should NOT be deleted
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'active-file.pdf',
      originalName: 'active-file.pdf',
      fileKey: 'storage/tenant-1/active-file.pdf',
      path: '/active-file.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.deletedFiles).toBe(2);
    expect(result.deletedFolders).toBe(1);
    expect(result.deletedS3Objects).toBe(2);
    expect(result.s3Errors).toBe(0);
    expect(fakeFileUploadService.delete).toHaveBeenCalledTimes(2);

    // Active file should still exist
    expect(storageFilesRepository.items).toHaveLength(1);
    expect(storageFilesRepository.items[0].name).toBe('active-file.pdf');

    // No soft-deleted folders should remain
    const deletedFolders = storageFoldersRepository.items.filter(
      (item) => item.deletedAt !== null,
    );
    expect(deletedFolders).toHaveLength(0);
  });

  it('should return zero when trash is empty', async () => {
    // Create only active items
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

    expect(result.deletedFiles).toBe(0);
    expect(result.deletedFolders).toBe(0);
    expect(result.deletedS3Objects).toBe(0);
    expect(result.s3Errors).toBe(0);

    // Active items should be untouched
    expect(storageFilesRepository.items).toHaveLength(1);
    expect(storageFoldersRepository.items).toHaveLength(1);
  });
});
