import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListFileVersionsUseCase } from './list-file-versions';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let sut: ListFileVersionsUseCase;

describe('ListFileVersionsUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();

    sut = new ListFileVersionsUseCase(
      storageFilesRepository,
      storageFileVersionsRepository,
    );
  });

  it('should list all versions of a file', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/folder-1/report.pdf',
      path: '/documents/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: createdFile.id.toString(),
      version: 1,
      fileKey: 'storage/tenant-1/folder-1/report-v1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: createdFile.id.toString(),
      version: 2,
      fileKey: 'storage/tenant-1/folder-1/report-v2.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      changeNote: 'Updated charts',
      uploadedBy: 'user-2',
    });

    await storageFileVersionsRepository.create({
      fileId: createdFile.id.toString(),
      version: 3,
      fileKey: 'storage/tenant-1/folder-1/report-v3.pdf',
      size: 3072,
      mimeType: 'application/pdf',
      changeNote: 'Final review',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    expect(result.versions).toHaveLength(3);
  });

  it('should return empty array when file has no versions', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'new-file.txt',
      originalName: 'new-file.txt',
      fileKey: 'storage/tenant-1/folder-1/new-file.txt',
      path: '/documents/new-file.txt',
      size: 512,
      mimeType: 'text/plain',
      fileType: 'other',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
    });

    expect(result.versions).toHaveLength(0);
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should only return versions for the specified file', async () => {
    const fileA = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'file-a.pdf',
      originalName: 'file-a.pdf',
      fileKey: 'storage/tenant-1/folder-1/file-a.pdf',
      path: '/documents/file-a.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const fileB = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'file-b.pdf',
      originalName: 'file-b.pdf',
      fileKey: 'storage/tenant-1/folder-1/file-b.pdf',
      path: '/documents/file-b.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: fileA.id.toString(),
      version: 1,
      fileKey: 'key-a-v1',
      size: 1024,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: fileB.id.toString(),
      version: 1,
      fileKey: 'key-b-v1',
      size: 2048,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    const resultA = await sut.execute({
      tenantId: TENANT_ID,
      fileId: fileA.id.toString(),
    });

    expect(resultA.versions).toHaveLength(1);
    expect(resultA.versions[0].fileKey).toBe('key-a-v1');
  });
});
