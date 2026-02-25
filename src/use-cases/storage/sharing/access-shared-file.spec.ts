import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageShareLinksRepository } from '@/repositories/storage/in-memory/in-memory-storage-share-links-repository';
import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccessSharedFileUseCase } from './access-shared-file';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageShareLinksRepository: InMemoryStorageShareLinksRepository;
let sut: AccessSharedFileUseCase;

describe('AccessSharedFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageShareLinksRepository = new InMemoryStorageShareLinksRepository();

    sut = new AccessSharedFileUseCase(
      storageFilesRepository,
      storageShareLinksRepository,
    );
  });

  it('should return file info for a valid share link', async () => {
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
      token: 'valid-token',
      createdBy: USER_ID,
    });

    const result = await sut.execute({ token: 'valid-token' });

    expect(result.file.name).toBe('document.pdf');
    expect(result.shareLink.token).toBe('valid-token');
  });

  it('should return file info when correct password is provided', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'secret.pdf',
      originalName: 'secret.pdf',
      fileKey: 'storage/tenant-1/secret.pdf',
      path: '/documents/secret.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: USER_ID,
    });

    const hashedPassword = await hash('my-password', 10);

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'password-token',
      password: hashedPassword,
      createdBy: USER_ID,
    });

    const result = await sut.execute({
      token: 'password-token',
      password: 'my-password',
    });

    expect(result.file.name).toBe('secret.pdf');
  });

  it('should throw when share link does not exist', async () => {
    await expect(sut.execute({ token: 'non-existent-token' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('should throw when share link is inactive (revoked)', async () => {
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

    const shareLink = await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'revoked-token',
      createdBy: USER_ID,
    });

    shareLink.revoke();
    await storageShareLinksRepository.save(shareLink);

    await expect(sut.execute({ token: 'revoked-token' })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('should throw when share link has expired', async () => {
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

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'expired-token',
      expiresAt: pastDate,
      createdBy: USER_ID,
    });

    await expect(sut.execute({ token: 'expired-token' })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('should throw when download limit is reached', async () => {
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

    const shareLink = await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'limit-token',
      maxDownloads: 1,
      createdBy: USER_ID,
    });

    // Manually increment download count to reach the limit
    shareLink.incrementDownloads();
    await storageShareLinksRepository.save(shareLink);

    await expect(sut.execute({ token: 'limit-token' })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('should throw when password is required but not provided', async () => {
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

    const hashedPassword = await hash('secret', 10);

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'pw-required-token',
      password: hashedPassword,
      createdBy: USER_ID,
    });

    await expect(sut.execute({ token: 'pw-required-token' })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('should throw when wrong password is provided', async () => {
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

    const hashedPassword = await hash('correct-password', 10);

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'pw-wrong-token',
      password: hashedPassword,
      createdBy: USER_ID,
    });

    await expect(
      sut.execute({ token: 'pw-wrong-token', password: 'wrong-password' }),
    ).rejects.toThrow(ForbiddenError);
  });
});
