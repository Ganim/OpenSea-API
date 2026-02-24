import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListFilesUseCase } from './list-files';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: ListFilesUseCase;

describe('ListFilesUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new ListFilesUseCase(storageFilesRepository);
  });

  it('should list files with pagination', async () => {
    // Create 5 files
    for (let fileIndex = 0; fileIndex < 5; fileIndex++) {
      await storageFilesRepository.create({
        tenantId: TENANT_ID,
        folderId: 'folder-1',
        name: `file-${fileIndex}.pdf`,
        originalName: `file-${fileIndex}.pdf`,
        fileKey: `storage/tenant-1/folder-1/file-${fileIndex}.pdf`,
        path: `/documents/file-${fileIndex}.pdf`,
        size: 1024 * (fileIndex + 1),
        mimeType: 'application/pdf',
        fileType: 'pdf',
        uploadedBy: 'user-1',
      });
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 3,
    });

    expect(result.files).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(3);
    expect(result.pages).toBe(2);
  });

  it('should filter files by folder', async () => {
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'file-in-folder-1.pdf',
      originalName: 'file-in-folder-1.pdf',
      fileKey: 'storage/tenant-1/folder-1/file-in-folder-1.pdf',
      path: '/documents/file-in-folder-1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-2',
      name: 'file-in-folder-2.pdf',
      originalName: 'file-in-folder-2.pdf',
      fileKey: 'storage/tenant-1/folder-2/file-in-folder-2.pdf',
      path: '/archives/file-in-folder-2.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('file-in-folder-1.pdf');
  });

  it('should filter files by file type', async () => {
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
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/folder-1/report.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileType: 'image',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('photo.jpg');
  });

  it('should search files by name', async () => {
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'Annual Report 2025.pdf',
      originalName: 'Annual Report 2025.pdf',
      fileKey: 'storage/tenant-1/folder-1/annual-report.pdf',
      path: '/documents/annual-report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'Invoice January.pdf',
      originalName: 'Invoice January.pdf',
      fileKey: 'storage/tenant-1/folder-1/invoice-jan.pdf',
      path: '/documents/invoice-jan.pdf',
      size: 512,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      search: 'annual',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('Annual Report 2025.pdf');
  });

  it('should return empty results when no files match', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.files).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.pages).toBe(0);
  });

  it('should cap limit at 100', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      limit: 200,
    });

    expect(result.limit).toBe(100);
  });

  it('should use default pagination values', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should filter files by entity binding', async () => {
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'product-photo.jpg',
      originalName: 'product-photo.jpg',
      fileKey: 'storage/tenant-1/folder-1/product-photo.jpg',
      path: '/documents/product-photo.jpg',
      size: 4096,
      mimeType: 'image/jpeg',
      fileType: 'image',
      entityType: 'product',
      entityId: 'product-123',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'general-doc.pdf',
      originalName: 'general-doc.pdf',
      fileKey: 'storage/tenant-1/folder-1/general-doc.pdf',
      path: '/documents/general-doc.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      entityType: 'product',
      entityId: 'product-123',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('product-photo.jpg');
  });
});
