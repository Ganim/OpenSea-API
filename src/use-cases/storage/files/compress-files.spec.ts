import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PlanLimitExceededError } from '@/@errors/use-cases/plan-limit-exceeded-error';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompressFilesUseCase } from './compress-files';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let fileUploadService: FakeFileUploadService;
let sut: CompressFilesUseCase;

describe('CompressFilesUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    fileUploadService = new FakeFileUploadService();

    // Make getObject return a small buffer so archiver has data to work with
    fileUploadService.getObject = async (_key: string) =>
      Buffer.from('file-content');

    sut = new CompressFilesUseCase(
      storageFilesRepository,
      storageFoldersRepository,
      fileUploadService,
    );
  });

  it('should compress selected files into a ZIP', async () => {
    const file1 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'document.pdf',
      originalName: 'document.pdf',
      fileKey: 'storage/tenant-1/files/document.pdf',
      path: '/document.pdf',
      size: 100,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const file2 = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'image.png',
      originalName: 'image.png',
      fileKey: 'storage/tenant-1/files/image.png',
      path: '/image.png',
      size: 200,
      mimeType: 'image/png',
      fileType: 'image',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [file1.id.toString(), file2.id.toString()],
      folderIds: [],
      userId: 'user-1',
    });

    expect(result.file).toBeDefined();
    expect(result.file.mimeType).toBe('application/zip');
    expect(result.file.fileType).toBe('archive');
    expect(result.file.name).toContain('compactado-');
    expect(result.file.name).toContain('.zip');
  });

  it('should throw if no files or folders selected', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileIds: [],
        folderIds: [],
        userId: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if no files are found after collecting', async () => {
    // Pass non-existent IDs so files resolve to nothing
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileIds: ['non-existent-1'],
        folderIds: [],
        userId: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if total size exceeds MAX_ZIP_SIZE (500MB)', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'huge-file.bin',
      originalName: 'huge-file.bin',
      fileKey: 'storage/tenant-1/files/huge-file.bin',
      path: '/huge-file.bin',
      size: 600 * 1024 * 1024,
      mimeType: 'application/octet-stream',
      fileType: 'other',
      uploadedBy: 'user-1',
    });

    // Return a buffer larger than 500MB
    const largeBuffer = Buffer.alloc(501 * 1024 * 1024);
    fileUploadService.getObject = async () => largeBuffer;

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileIds: [file.id.toString()],
        folderIds: [],
        userId: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should check storage quota and throw PlanLimitExceededError when exceeded', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/files/report.pdf',
      path: '/report.pdf',
      size: 5000,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    // maxStorageBytes = 1 byte, so any ZIP will exceed it
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileIds: [file.id.toString()],
        folderIds: [],
        userId: 'user-1',
        maxStorageBytes: 1,
      }),
    ).rejects.toThrow(PlanLimitExceededError);
  });

  it('should include folder contents recursively', async () => {
    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: null,
      name: 'my-folder',
      slug: 'my-folder',
      path: '/my-folder',
      createdBy: 'user-1',
    });

    const childFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: folder.id.toString(),
      name: 'subfolder',
      slug: 'subfolder',
      path: '/my-folder/subfolder',
      createdBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'root-file.txt',
      originalName: 'root-file.txt',
      fileKey: 'storage/tenant-1/files/root-file.txt',
      path: '/my-folder/root-file.txt',
      size: 50,
      mimeType: 'text/plain',
      fileType: 'other',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
      name: 'nested-file.txt',
      originalName: 'nested-file.txt',
      fileKey: 'storage/tenant-1/files/nested-file.txt',
      path: '/my-folder/subfolder/nested-file.txt',
      size: 30,
      mimeType: 'text/plain',
      fileType: 'other',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [],
      folderIds: [folder.id.toString()],
      userId: 'user-1',
    });

    expect(result.file).toBeDefined();
    expect(result.file.mimeType).toBe('application/zip');
  });

  it('should save the ZIP in the target folder when provided', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'doc.pdf',
      originalName: 'doc.pdf',
      fileKey: 'storage/tenant-1/files/doc.pdf',
      path: '/doc.pdf',
      size: 100,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const targetFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: null,
      name: 'target',
      slug: 'target',
      path: '/target',
      createdBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [file.id.toString()],
      folderIds: [],
      targetFolderId: targetFolder.id.toString(),
      userId: 'user-1',
    });

    expect(result.file.folderId?.toString()).toBe(targetFolder.id.toString());
  });

  it('should skip non-existent file IDs gracefully', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'valid.pdf',
      originalName: 'valid.pdf',
      fileKey: 'storage/tenant-1/files/valid.pdf',
      path: '/valid.pdf',
      size: 100,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileIds: [file.id.toString(), 'non-existent-id'],
      folderIds: [],
      userId: 'user-1',
    });

    expect(result.file).toBeDefined();
    expect(result.file.mimeType).toBe('application/zip');
  });
});
