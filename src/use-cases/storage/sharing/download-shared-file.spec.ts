import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageShareLinksRepository } from '@/repositories/storage/in-memory/in-memory-storage-share-links-repository';
import type {
  FileUploadService,
  UploadResult,
} from '@/services/storage/file-upload-service';
import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DownloadSharedFileUseCase } from './download-shared-file';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

class FakeFileUploadService implements FileUploadService {
  async upload(
    _fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: { prefix: string },
  ): Promise<UploadResult> {
    return {
      key: `${options.prefix}/${fileName}`,
      url: `https://fake-storage.example.com/${options.prefix}/${fileName}`,
      size: _fileBuffer.length,
      mimeType,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    return `https://fake-storage.example.com/${key}?signed=true`;
  }

  async delete(_key: string): Promise<void> {}

  async getObject(_key: string): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  async initiateMultipartUpload(
    _fileName: string,
    _mimeType: string,
    _options: { prefix: string },
  ) {
    return { uploadId: 'test-upload-id', key: 'test-key' };
  }

  async getPresignedPartUrls(
    _key: string,
    _uploadId: string,
    _totalParts: number,
  ) {
    return [];
  }

  async completeMultipartUpload(
    _key: string,
    _uploadId: string,
    _parts: { partNumber: number; etag: string }[],
  ): Promise<UploadResult> {
    return {
      key: _key,
      url: `https://fake-storage.example.com/${_key}`,
      size: 0,
      mimeType: 'application/octet-stream',
    };
  }

  async abortMultipartUpload(_key: string, _uploadId: string): Promise<void> {}
}

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

    expect(result.url).toContain('storage/tenant-1/document.pdf');
    expect(result.url).toContain('signed=true');

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

    expect(result.url).toContain('signed=true');
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
