import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { PreviewFileUseCase } from './preview-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let fileUploadService: FakeFileUploadService;
let sut: PreviewFileUseCase;

describe('PreviewFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    fileUploadService = new FakeFileUploadService();
    sut = new PreviewFileUseCase(storageFilesRepository, fileUploadService);
  });

  it('should return preview data for an image', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'photo.jpg',
      originalName: 'photo.jpg',
      fileKey: 'storage/tenant-1/photo.jpg',
      path: '/folder/photo.jpg',
      size: 2048,
      mimeType: 'image/jpeg',
      fileType: 'IMAGE',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(result.previewable).toBe(true);
    expect(result.name).toBe('photo.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.url).toContain('signed=true');
  });

  it('should return preview data for a PDF', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/report.pdf',
      path: '/folder/report.pdf',
      size: 4096,
      mimeType: 'application/pdf',
      fileType: 'PDF',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(result.previewable).toBe(true);
    expect(result.fileType).toBe('PDF');
  });

  it('should return previewable=false for non-previewable files', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'archive.zip',
      originalName: 'archive.zip',
      fileKey: 'storage/tenant-1/archive.zip',
      path: '/folder/archive.zip',
      size: 8192,
      mimeType: 'application/zip',
      fileType: 'ARCHIVE',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(result.previewable).toBe(false);
  });

  it('should return previewable=true for video', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'clip.mp4',
      originalName: 'clip.mp4',
      fileKey: 'storage/tenant-1/clip.mp4',
      path: '/folder/clip.mp4',
      size: 10240,
      mimeType: 'video/mp4',
      fileType: 'VIDEO',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(result.previewable).toBe(true);
  });

  it('should throw when file not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
