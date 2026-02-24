import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetStorageStatsUseCase } from './get-storage-stats';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: GetStorageStatsUseCase;

describe('GetStorageStatsUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new GetStorageStatsUseCase(storageFilesRepository);
  });

  it('should return storage statistics', async () => {
    await storageFilesRepository.create({
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

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'photo.jpg',
      originalName: 'photo.jpg',
      fileKey: 'storage/tenant-1/folder-1/photo.jpg',
      path: '/documents/photo.jpg',
      size: 4096,
      mimeType: 'image/jpeg',
      fileType: 'image',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'invoice.pdf',
      originalName: 'invoice.pdf',
      fileKey: 'storage/tenant-1/folder-1/invoice.pdf',
      path: '/documents/invoice.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalFiles).toBe(3);
    expect(result.totalSize).toBe(1024 + 4096 + 2048);
    expect(result.filesByType).toEqual({
      pdf: 2,
      image: 1,
    });
  });

  it('should return zero stats when no files exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalFiles).toBe(0);
    expect(result.totalSize).toBe(0);
    expect(result.filesByType).toEqual({});
  });

  it('should not include files from other tenants', async () => {
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'my-file.pdf',
      originalName: 'my-file.pdf',
      fileKey: 'storage/tenant-1/folder-1/my-file.pdf',
      path: '/documents/my-file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: 'other-tenant',
      folderId: 'folder-2',
      name: 'other-file.pdf',
      originalName: 'other-file.pdf',
      fileKey: 'storage/other-tenant/folder-2/other-file.pdf',
      path: '/documents/other-file.pdf',
      size: 8192,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-2',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalFiles).toBe(1);
    expect(result.totalSize).toBe(1024);
  });

  it('should not include soft-deleted files', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'deleted-file.pdf',
      originalName: 'deleted-file.pdf',
      fileKey: 'storage/tenant-1/folder-1/deleted-file.pdf',
      path: '/documents/deleted-file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'active-file.pdf',
      originalName: 'active-file.pdf',
      fileKey: 'storage/tenant-1/folder-1/active-file.pdf',
      path: '/documents/active-file.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.softDelete(createdFile.id);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalFiles).toBe(1);
    expect(result.totalSize).toBe(2048);
  });
});
