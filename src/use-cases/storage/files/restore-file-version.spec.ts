import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RestoreFileVersionUseCase } from './restore-file-version';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let sut: RestoreFileVersionUseCase;

describe('RestoreFileVersionUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();

    sut = new RestoreFileVersionUseCase(
      storageFilesRepository,
      storageFileVersionsRepository,
    );
  });

  it('should restore a previous version by creating a new version', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/folder-1/report-v2.pdf',
      path: '/documents/report.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    // Simulate existing file at version 2
    await storageFilesRepository.update({
      id: createdFile.id,
      currentVersion: 2,
    });

    const versionOne = await storageFileVersionsRepository.create({
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
      uploadedBy: 'user-2',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      versionId: versionOne.id.toString(),
    });

    // Should create version 3 (snapshot of current) + version 4 (restored from v1)
    expect(result.file.currentVersion).toBe(4);
    expect(result.version.version).toBe(4);
    expect(result.version.fileKey).toBe(
      'storage/tenant-1/folder-1/report-v1.pdf',
    );
    expect(result.version.changeNote).toBe('Restored from version 1');
    expect(result.file.fileKey).toBe('storage/tenant-1/folder-1/report-v1.pdf');
    expect(result.file.size).toBe(1024);
  });

  it('should throw when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
        versionId: 'some-version-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when version does not exist', async () => {
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

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: createdFile.id.toString(),
        versionId: 'non-existent-version',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should increment the total number of versions', async () => {
    const createdFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: 'folder-1',
      name: 'doc.docx',
      originalName: 'doc.docx',
      fileKey: 'storage/tenant-1/folder-1/doc-v1.docx',
      path: '/documents/doc.docx',
      size: 512,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'document',
      uploadedBy: 'user-1',
    });

    const versionOne = await storageFileVersionsRepository.create({
      fileId: createdFile.id.toString(),
      version: 1,
      fileKey: 'storage/tenant-1/folder-1/doc-v1.docx',
      size: 512,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedBy: 'user-1',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      fileId: createdFile.id.toString(),
      versionId: versionOne.id.toString(),
    });

    // Should now have 3 versions: original + snapshot + restored
    expect(storageFileVersionsRepository.items).toHaveLength(3);
  });
});
