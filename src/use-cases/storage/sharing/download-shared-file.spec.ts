import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageShareLinksRepository } from '@/repositories/storage/in-memory/in-memory-storage-share-links-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';
import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DownloadSharedFileUseCase } from './download-shared-file';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageShareLinksRepository: InMemoryStorageShareLinksRepository;
let fileUploadService: FakeFileUploadService;
let sut: DownloadSharedFileUseCase;

describe('DownloadSharedFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageShareLinksRepository = new InMemoryStorageShareLinksRepository();
    fileUploadService = new FakeFileUploadService();

    sut = new DownloadSharedFileUseCase(
      storageFilesRepository,
      storageShareLinksRepository,
      fileUploadService,
    );
  });

  it('should return a presigned URL and increment download count', async () => {
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

    const _shareLink = await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'download-token',
      createdBy: USER_ID,
    });

    const result = await sut.execute({ token: 'download-token' });

    expect(typeof result.url).toBe('string');
    expect(result.url).toContain('signed');
    expect(result.fileName).toBe('document.pdf');
    expect(result.mimeType).toBe('application/pdf');

    const updatedLink =
      await storageShareLinksRepository.findByToken('download-token');
    expect(updatedLink?.downloadCount).toBe(1);
  });

  it('should work with password-protected links', async () => {
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

    const hashedPassword = await hash('download-pass', 10);

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'pw-download-token',
      password: hashedPassword,
      createdBy: USER_ID,
    });

    const result = await sut.execute({
      token: 'pw-download-token',
      password: 'download-pass',
    });

    expect(typeof result.url).toBe('string');
    expect(result.fileName).toBe('secret.pdf');
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
      token: 'revoked-dl-token',
      createdBy: USER_ID,
    });

    shareLink.revoke();
    await storageShareLinksRepository.save(shareLink);

    await expect(sut.execute({ token: 'revoked-dl-token' })).rejects.toThrow(
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
      token: 'expired-dl-token',
      expiresAt: pastDate,
      createdBy: USER_ID,
    });

    await expect(sut.execute({ token: 'expired-dl-token' })).rejects.toThrow(
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
      token: 'limited-dl-token',
      maxDownloads: 2,
      createdBy: USER_ID,
    });

    // Use up the download limit
    shareLink.incrementDownloads();
    shareLink.incrementDownloads();
    await storageShareLinksRepository.save(shareLink);

    await expect(sut.execute({ token: 'limited-dl-token' })).rejects.toThrow(
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

    const hashedPassword = await hash('correct-pass', 10);

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'pw-wrong-dl-token',
      password: hashedPassword,
      createdBy: USER_ID,
    });

    await expect(
      sut.execute({ token: 'pw-wrong-dl-token', password: 'wrong-pass' }),
    ).rejects.toThrow(ForbiddenError);
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

    const hashedPassword = await hash('required-pass', 10);

    await storageShareLinksRepository.create({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      token: 'pw-needed-dl-token',
      password: hashedPassword,
      createdBy: USER_ID,
    });

    await expect(sut.execute({ token: 'pw-needed-dl-token' })).rejects.toThrow(
      ForbiddenError,
    );
  });
});
