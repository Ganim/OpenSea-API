import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageShareLinksRepository } from '@/repositories/storage/in-memory/in-memory-storage-share-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateShareLinkUseCase } from './create-share-link';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageShareLinksRepository: InMemoryStorageShareLinksRepository;
let sut: CreateShareLinkUseCase;

describe('CreateShareLinkUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageShareLinksRepository = new InMemoryStorageShareLinksRepository();

    sut = new CreateShareLinkUseCase(
      storageFilesRepository,
      storageShareLinksRepository,
    );
  });

  it('should create a share link for an existing file', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'document.pdf',
      originalName: 'document.pdf',
      fileKey: 'storage/tenant-1/document.pdf',
      path: '/documents/document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: USER_ID,
    });

    const { shareLink } = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      createdBy: USER_ID,
    });

    expect(shareLink.token).toHaveLength(64);
    expect(shareLink.isActive).toBe(true);
    expect(shareLink.downloadCount).toBe(0);
    expect(shareLink.expiresAt).toBeNull();
    expect(shareLink.password).toBeNull();
    expect(shareLink.maxDownloads).toBeNull();
    expect(shareLink.createdBy).toBe(USER_ID);
  });

  it('should create a share link with expiration', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'document.pdf',
      originalName: 'document.pdf',
      fileKey: 'storage/tenant-1/document.pdf',
      path: '/documents/document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: USER_ID,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { shareLink } = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      createdBy: USER_ID,
      expiresAt,
    });

    expect(shareLink.expiresAt).toEqual(expiresAt);
  });

  it('should create a share link with password', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'document.pdf',
      originalName: 'document.pdf',
      fileKey: 'storage/tenant-1/document.pdf',
      path: '/documents/document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: USER_ID,
    });

    const { shareLink } = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      createdBy: USER_ID,
      password: 'secret123',
    });

    expect(shareLink.password).not.toBeNull();
    expect(shareLink.password).not.toBe('secret123');
  });

  it('should create a share link with max downloads', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'document.pdf',
      originalName: 'document.pdf',
      fileKey: 'storage/tenant-1/document.pdf',
      path: '/documents/document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: USER_ID,
    });

    const { shareLink } = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      createdBy: USER_ID,
      maxDownloads: 5,
    });

    expect(shareLink.maxDownloads).toBe(5);
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
        createdBy: USER_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
