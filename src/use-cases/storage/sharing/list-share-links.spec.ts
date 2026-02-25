import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageShareLinksRepository } from '@/repositories/storage/in-memory/in-memory-storage-share-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListShareLinksUseCase } from './list-share-links';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageShareLinksRepository: InMemoryStorageShareLinksRepository;
let sut: ListShareLinksUseCase;

describe('ListShareLinksUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageShareLinksRepository = new InMemoryStorageShareLinksRepository();

    sut = new ListShareLinksUseCase(
      storageFilesRepository,
      storageShareLinksRepository,
    );
  });

  it('should list all share links for a file', async () => {
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

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'token-1',
      createdBy: USER_ID,
    });

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'token-2',
      createdBy: USER_ID,
    });

    const { shareLinks } = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(shareLinks).toHaveLength(2);
  });

  it('should return empty array when file has no share links', async () => {
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

    const { shareLinks } = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(shareLinks).toHaveLength(0);
  });

  it('should not return share links from another tenant', async () => {
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

    // Create a share link from a different tenant but same file id
    const otherFileId = new UniqueEntityID();
    await storageShareLinksRepository.create({
      tenantId: 'tenant-2',
      fileId: otherFileId.toString(),
      token: 'token-other',
      createdBy: USER_ID,
    });

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'token-mine',
      createdBy: USER_ID,
    });

    const { shareLinks } = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(shareLinks).toHaveLength(1);
    expect(shareLinks[0].token).toBe('token-mine');
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
