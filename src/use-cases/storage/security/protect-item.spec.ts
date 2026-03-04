import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProtectItemUseCase } from './protect-item';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: ProtectItemUseCase;

describe('ProtectItemUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new ProtectItemUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
  });

  it('should protect a file with a password', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'secret.pdf',
      originalName: 'secret.pdf',
      fileKey: 'storage/tenant-1/secret.pdf',
      path: '/secret.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
      password: 'test1234',
    });

    const updatedFile = storageFilesRepository.items[0];
    expect(updatedFile.isProtected).toBe(true);
    expect(updatedFile.protectionHash).toBeTruthy();
    expect(updatedFile.protectionHash).not.toBe('test1234'); // Should be hashed
  });

  it('should protect a folder with a password', async () => {
    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Private',
      slug: 'private',
      path: '/private',
    });

    const folder = storageFoldersRepository.items[0];

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: folder.id.toString(),
      itemType: 'folder',
      password: 'secret123',
    });

    const updatedFolder = storageFoldersRepository.items[0];
    expect(updatedFolder.isProtected).toBe(true);
    expect(updatedFolder.protectionHash).toBeTruthy();
  });

  it('should throw ResourceNotFoundError when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: 'non-existent',
        itemType: 'file',
        password: 'test1234',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: 'non-existent',
        itemType: 'folder',
        password: 'test1234',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should allow re-protecting an already protected file (updates hash)', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'secret.pdf',
      originalName: 'secret.pdf',
      fileKey: 'storage/tenant-1/secret.pdf',
      path: '/secret.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
      password: 'first-pass',
    });

    const firstHash = storageFilesRepository.items[0].protectionHash;

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
      password: 'second-pass',
    });

    const secondHash = storageFilesRepository.items[0].protectionHash;
    expect(secondHash).not.toBe(firstHash);
  });
});
