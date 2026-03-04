import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { VerifyProtectionUseCase } from './verify-protection';

const TENANT_ID = 'tenant-1';
const PASSWORD = 'test1234';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: VerifyProtectionUseCase;

describe('VerifyProtectionUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new VerifyProtectionUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
  });

  it('should return valid: true for correct password on a protected file', async () => {
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

    const result = await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
      password: PASSWORD,
    });

    expect(result.valid).toBe(true);
  });

  it('should return valid: false for incorrect password on a protected file', async () => {
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

    const result = await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
      password: 'wrong-password',
    });

    expect(result.valid).toBe(false);
  });

  it('should return valid: true for an unprotected file (no hash)', async () => {
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

    const result = await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
      password: 'any-password',
    });

    expect(result.valid).toBe(true);
  });

  it('should return valid: true for correct password on a protected folder', async () => {
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

    const result = await sut.execute({
      tenantId: TENANT_ID,
      itemId: folder.id.toString(),
      itemType: 'folder',
      password: PASSWORD,
    });

    expect(result.valid).toBe(true);
  });

  it('should return valid: false for incorrect password on a protected folder', async () => {
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

    const result = await sut.execute({
      tenantId: TENANT_ID,
      itemId: folder.id.toString(),
      itemType: 'folder',
      password: 'wrong-password',
    });

    expect(result.valid).toBe(false);
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
