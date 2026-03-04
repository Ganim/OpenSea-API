import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnprotectItemUseCase } from './unprotect-item';

const TENANT_ID = 'tenant-1';
const PASSWORD = 'test1234';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: UnprotectItemUseCase;

describe('UnprotectItemUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new UnprotectItemUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
  });

  it('should unprotect a file with the correct password', async () => {
    const protectionHash = await hash(PASSWORD, 10);
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

    // Manually set protection on the file
    await storageFilesRepository.update({
      id: file.id,
      isProtected: true,
      protectionHash,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
      password: PASSWORD,
    });

    const updatedFile = storageFilesRepository.items[0];
    expect(updatedFile.isProtected).toBe(false);
    expect(updatedFile.protectionHash).toBeNull();
  });

  it('should unprotect a folder with the correct password', async () => {
    const protectionHash = await hash(PASSWORD, 10);
    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Private',
      slug: 'private',
      path: '/private',
    });

    const folder = storageFoldersRepository.items[0];
    await storageFoldersRepository.update({
      id: folder.id,
      isProtected: true,
      protectionHash,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: folder.id.toString(),
      itemType: 'folder',
      password: PASSWORD,
    });

    const updatedFolder = storageFoldersRepository.items[0];
    expect(updatedFolder.isProtected).toBe(false);
    expect(updatedFolder.protectionHash).toBeNull();
  });

  it('should throw BadRequestError when password is incorrect (file)', async () => {
    const protectionHash = await hash(PASSWORD, 10);
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

    await storageFilesRepository.update({
      id: file.id,
      isProtected: true,
      protectionHash,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: file.id.toString(),
        itemType: 'file',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when file is not protected', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'public.pdf',
      originalName: 'public.pdf',
      fileKey: 'storage/tenant-1/public.pdf',
      path: '/public.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: file.id.toString(),
        itemType: 'file',
        password: PASSWORD,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when folder is not protected', async () => {
    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Public',
      slug: 'public',
      path: '/public',
    });

    const folder = storageFoldersRepository.items[0];

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: folder.id.toString(),
        itemType: 'folder',
        password: PASSWORD,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ResourceNotFoundError when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: 'non-existent',
        itemType: 'file',
        password: PASSWORD,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: 'non-existent',
        itemType: 'folder',
        password: PASSWORD,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
