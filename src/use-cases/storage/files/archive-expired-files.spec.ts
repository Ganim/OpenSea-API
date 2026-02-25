import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ArchiveExpiredFilesUseCase } from './archive-expired-files';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: ArchiveExpiredFilesUseCase;

describe('ArchiveExpiredFilesUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new ArchiveExpiredFilesUseCase(storageFilesRepository);
  });

  it('should archive files with expiresAt in the past', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'expired-doc.pdf',
      originalName: 'expired-doc.pdf',
      fileKey: 'storage/tenant-1/folder-1/expired-doc.pdf',
      path: '/docs/expired-doc.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.archivedCount).toBe(1);
    expect(result.errors).toBe(0);

    const updatedFile = storageFilesRepository.items.find((f) =>
      f.id.equals(file.id),
    );
    expect(updatedFile?.status.value).toBe('ARCHIVED');
  });

  it('should not archive files without expiresAt (null)', async () => {
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'no-expiry.pdf',
      originalName: 'no-expiry.pdf',
      fileKey: 'storage/tenant-1/folder-1/no-expiry.pdf',
      path: '/docs/no-expiry.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.archivedCount).toBe(0);
    expect(result.errors).toBe(0);

    // File should remain ACTIVE
    expect(storageFilesRepository.items[0].status.value).toBe('ACTIVE');
  });

  it('should not archive files with expiresAt in the future', async () => {
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'future-expiry.pdf',
      originalName: 'future-expiry.pdf',
      fileKey: 'storage/tenant-1/folder-1/future-expiry.pdf',
      path: '/docs/future-expiry.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.archivedCount).toBe(0);
    expect(result.errors).toBe(0);

    // File should remain ACTIVE
    expect(storageFilesRepository.items[0].status.value).toBe('ACTIVE');
  });

  it('should not archive already deleted files', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'deleted-expired.pdf',
      originalName: 'deleted-expired.pdf',
      fileKey: 'storage/tenant-1/folder-1/deleted-expired.pdf',
      path: '/docs/deleted-expired.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });

    // Soft-delete the file
    await storageFilesRepository.softDelete(file.id);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.archivedCount).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('should respect batchSize limit', async () => {
    // Create 5 expired files
    for (let i = 0; i < 5; i++) {
      await storageFilesRepository.create({
        tenantId: TENANT_ID,
        folderId: 'folder-1',
        name: `expired-${i}.txt`,
        originalName: `expired-${i}.txt`,
        fileKey: `storage/tenant-1/folder-1/expired-${i}.txt`,
        path: `/docs/expired-${i}.txt`,
        size: 512,
        mimeType: 'text/plain',
        fileType: 'DOCUMENT',
        uploadedBy: 'user-1',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      });
    }

    const result = await sut.execute({ tenantId: TENANT_ID, batchSize: 3 });

    expect(result.archivedCount).toBe(3);
    expect(result.errors).toBe(0);

    // 3 archived, 2 still active
    const activeFiles = storageFilesRepository.items.filter(
      (f) => f.status.value === 'ACTIVE',
    );
    const archivedFiles = storageFilesRepository.items.filter(
      (f) => f.status.value === 'ARCHIVED',
    );
    expect(activeFiles).toHaveLength(2);
    expect(archivedFiles).toHaveLength(3);
  });

  it('should return 0 when no expired files exist', async () => {
    // Create only active files without expiration
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'normal-file.pdf',
      originalName: 'normal-file.pdf',
      fileKey: 'storage/tenant-1/folder-1/normal-file.pdf',
      path: '/docs/normal-file.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.archivedCount).toBe(0);
    expect(result.errors).toBe(0);
  });
});
