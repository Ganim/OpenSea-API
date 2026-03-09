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

  it('should isolate trash deletion across tenants', async () => {
    const TENANT_2 = 'tenant-2';

    // Create and soft-delete a file in tenant-1
    const file1 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'tenant1-trash.pdf',
      originalName: 'tenant1-trash.pdf',
      fileKey: 'storage/tenant-1/tenant1-trash.pdf',
      path: '/tenant1-trash.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(file1.id);

    // Create and soft-delete a file in tenant-2
    const file2 = await storageFilesRepository.create({
      tenantId: TENANT_2,
      folderId: null,
      name: 'tenant2-trash.pdf',
      originalName: 'tenant2-trash.pdf',
      fileKey: 'storage/tenant-2/tenant2-trash.pdf',
      path: '/tenant2-trash.pdf',
      size: 512,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-2',
    });
    await storageFilesRepository.softDelete(file2.id);

    // Empty trash for tenant-1 only
    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.deletedFiles).toBe(1);
    expect(result.deletedS3Objects).toBe(1);

    // Tenant-2 soft-deleted file should still exist
    expect(storageFilesRepository.items).toHaveLength(1);
    expect(storageFilesRepository.items[0].tenantId.toString()).toBe(TENANT_2);
    expect(storageFilesRepository.items[0].deletedAt).not.toBeNull();
  });

  it('should count s3Errors when file deletion fails', async () => {
    // Create 3 files and soft-delete them
    const file1 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'file1.pdf',
      originalName: 'file1.pdf',
      fileKey: 'storage/tenant-1/file1.pdf',
      path: '/file1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(file1.id);

    const file2 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'file2.pdf',
      originalName: 'file2.pdf',
      fileKey: 'storage/tenant-1/file2.pdf',
      path: '/file2.pdf',
      size: 512,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(file2.id);

    const file3 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'file3.pdf',
      originalName: 'file3.pdf',
      fileKey: 'storage/tenant-1/file3.pdf',
      path: '/file3.pdf',
      size: 256,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(file3.id);

    // Make S3 delete fail for one specific file
    vi.mocked(fakeFileUploadService.delete).mockImplementation(
      async (key: string) => {
        if (key === 'storage/tenant-1/file2.pdf') {
          throw new Error('S3 delete failed');
        }
      },
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.deletedFiles).toBe(3);
    expect(result.deletedS3Objects).toBe(2);
    expect(result.s3Errors).toBe(1);
    expect(fakeFileUploadService.delete).toHaveBeenCalledTimes(3);

    // All files should be hard-deleted from the repository regardless of S3 errors
    expect(storageFilesRepository.items).toHaveLength(0);
  });

  it('should hard-delete nested folders and their parent', async () => {
    // Create parent folder
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    // Create child folder inside parent
    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    // Soft-delete both (parent first, then child — simulates cascade)
    await storageFoldersRepository.softDelete(parentFolder.id);
    await storageFoldersRepository.softDelete(childFolder.id);

    // Also create a file in the child folder and soft-delete it
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
      name: 'nested-file.txt',
      originalName: 'nested-file.txt',
      fileKey: 'storage/tenant-1/nested-file.txt',
      path: `${childFolder.path}/nested-file.txt`,
      size: 128,
      mimeType: 'text/plain',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });
    await storageFilesRepository.softDelete(file.id);

    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.deletedFiles).toBe(1);
    expect(result.deletedFolders).toBe(2);
    expect(result.deletedS3Objects).toBe(1);
    expect(result.s3Errors).toBe(0);

    // Everything should be gone
    expect(storageFilesRepository.items).toHaveLength(0);
    expect(storageFoldersRepository.items).toHaveLength(0);
  });
});
