import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageShareLinksRepository } from '@/repositories/storage/in-memory/in-memory-storage-share-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RevokeShareLinkUseCase } from './revoke-share-link';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

let storageShareLinksRepository: InMemoryStorageShareLinksRepository;
let sut: RevokeShareLinkUseCase;

describe('RevokeShareLinkUseCase', () => {
  beforeEach(() => {
    storageShareLinksRepository = new InMemoryStorageShareLinksRepository();

    sut = new RevokeShareLinkUseCase(storageShareLinksRepository);
  });

  it('should revoke a share link', async () => {
    const shareLink = await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: 'file-1',
      token: 'valid-token',
      createdBy: USER_ID,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      linkId: shareLink.id.toString(),
    });

    const revokedLink = await storageShareLinksRepository.findById(
      shareLink.id,
      TENANT_ID,
    );

    expect(revokedLink?.isActive).toBe(false);
  });

  it('should throw when share link does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        linkId: 'non-existent-link',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when share link belongs to another tenant', async () => {
    const shareLink = await storageShareLinksRepository.create({
      tenantId: 'tenant-2',
      fileId: 'file-1',
      token: 'valid-token',
      createdBy: USER_ID,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        linkId: shareLink.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
