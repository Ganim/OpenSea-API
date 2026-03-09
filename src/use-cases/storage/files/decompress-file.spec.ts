import archiver from 'archiver';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { DecompressFileUseCase } from './decompress-file';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let fileUploadService: FakeFileUploadService;
let sut: DecompressFileUseCase;

/** Helper: creates a real ZIP buffer from an array of { path, content } entries */
async function createZipBuffer(
  entries: { path: string; content: string }[],
): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 1 } });
  const chunks: Buffer[] = [];
  archive.on('data', (chunk: Buffer) => chunks.push(chunk));

  for (const entry of entries) {
    archive.append(Buffer.from(entry.content), { name: entry.path });
  }

  await Promise.all([
    archive.finalize(),
    new Promise<void>((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
    }),
  ]);

  return Buffer.concat(chunks);
}

describe('DecompressFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    fileUploadService = new FakeFileUploadService();

    sut = new DecompressFileUseCase(
      storageFilesRepository,
      storageFoldersRepository,
      fileUploadService,
    );
  });

  it('should decompress a ZIP file with flat entries', async () => {
    const zipBuffer = await createZipBuffer([
      { path: 'file1.txt', content: 'hello' },
      { path: 'file2.txt', content: 'world' },
    ]);

    fileUploadService.getObject = async () => zipBuffer;

    const zipFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'archive.zip',
      originalName: 'archive.zip',
      fileKey: 'storage/tenant-1/files/archive.zip',
      path: '/archive.zip',
      size: zipBuffer.length,
      mimeType: 'application/zip',
      fileType: 'archive',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: zipFile.id.toString(),
      userId: 'user-1',
    });

    expect(result.files).toHaveLength(2);
    expect(result.folderCount).toBe(0);
    expect(result.files.map((f) => f.name).sort()).toEqual([
      'file1.txt',
      'file2.txt',
    ]);
  });

  it('should create intermediate folders for nested entries', async () => {
    const zipBuffer = await createZipBuffer([
      { path: 'docs/readme.txt', content: 'readme' },
      { path: 'docs/sub/deep.txt', content: 'deep' },
    ]);

    fileUploadService.getObject = async () => zipBuffer;

    const zipFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'nested.zip',
      originalName: 'nested.zip',
      fileKey: 'storage/tenant-1/files/nested.zip',
      path: '/nested.zip',
      size: zipBuffer.length,
      mimeType: 'application/zip',
      fileType: 'archive',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: zipFile.id.toString(),
      userId: 'user-1',
    });

    expect(result.files).toHaveLength(2);
    // "docs" + "docs/sub" = 2 folders
    expect(result.folderCount).toBe(2);
  });

  it('should throw ResourceNotFoundError when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-file',
        userId: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError for non-ZIP files', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'photo.jpg',
      originalName: 'photo.jpg',
      fileKey: 'storage/tenant-1/files/photo.jpg',
      path: '/photo.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      fileType: 'image',
      uploadedBy: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: file.id.toString(),
        userId: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should extract to the target folder when provided', async () => {
    const zipBuffer = await createZipBuffer([
      { path: 'file.txt', content: 'content' },
    ]);

    fileUploadService.getObject = async () => zipBuffer;

    const targetFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: null,
      name: 'destination',
      slug: 'destination',
      path: '/destination',
      createdBy: 'user-1',
    });

    const zipFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'archive.zip',
      originalName: 'archive.zip',
      fileKey: 'storage/tenant-1/files/archive.zip',
      path: '/archive.zip',
      size: zipBuffer.length,
      mimeType: 'application/zip',
      fileType: 'archive',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: zipFile.id.toString(),
      targetFolderId: targetFolder.id.toString(),
      userId: 'user-1',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].folderId?.toString()).toBe(
      targetFolder.id.toString(),
    );
  });

  it('should extract to the source file folder when no target specified', async () => {
    const zipBuffer = await createZipBuffer([
      { path: 'file.txt', content: 'content' },
    ]);

    fileUploadService.getObject = async () => zipBuffer;

    const sourceFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: null,
      name: 'source',
      slug: 'source',
      path: '/source',
      createdBy: 'user-1',
    });

    const zipFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: sourceFolder.id.toString(),
      name: 'archive.zip',
      originalName: 'archive.zip',
      fileKey: 'storage/tenant-1/files/archive.zip',
      path: '/source/archive.zip',
      size: zipBuffer.length,
      mimeType: 'application/zip',
      fileType: 'archive',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: zipFile.id.toString(),
      userId: 'user-1',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].folderId?.toString()).toBe(
      sourceFolder.id.toString(),
    );
  });

  it('should skip macOS metadata files (__MACOSX, .DS_Store)', async () => {
    const zipBuffer = await createZipBuffer([
      { path: '__MACOSX/._file.txt', content: 'metadata' },
      { path: '.DS_Store', content: 'store' },
      { path: 'real-file.txt', content: 'actual content' },
    ]);

    fileUploadService.getObject = async () => zipBuffer;

    const zipFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'mac-archive.zip',
      originalName: 'mac-archive.zip',
      fileKey: 'storage/tenant-1/files/mac-archive.zip',
      path: '/mac-archive.zip',
      size: zipBuffer.length,
      mimeType: 'application/zip',
      fileType: 'archive',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: zipFile.id.toString(),
      userId: 'user-1',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('real-file.txt');
  });

  it('should detect MIME types from file extensions', async () => {
    const zipBuffer = await createZipBuffer([
      { path: 'image.png', content: 'png-data' },
      { path: 'report.pdf', content: 'pdf-data' },
      { path: 'unknown.xyz', content: 'mystery' },
    ]);

    fileUploadService.getObject = async () => zipBuffer;

    const zipFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'mixed.zip',
      originalName: 'mixed.zip',
      fileKey: 'storage/tenant-1/files/mixed.zip',
      path: '/mixed.zip',
      size: zipBuffer.length,
      mimeType: 'application/zip',
      fileType: 'archive',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: zipFile.id.toString(),
      userId: 'user-1',
    });

    const mimeMap = new Map(result.files.map((f) => [f.name, f.mimeType]));

    expect(mimeMap.get('image.png')).toBe('image/png');
    expect(mimeMap.get('report.pdf')).toBe('application/pdf');
    expect(mimeMap.get('unknown.xyz')).toBe('chemical/x-xyz');
  });

  it('should accept application/x-zip-compressed MIME type', async () => {
    const zipBuffer = await createZipBuffer([
      { path: 'file.txt', content: 'content' },
    ]);

    fileUploadService.getObject = async () => zipBuffer;

    const zipFile = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'archive.zip',
      originalName: 'archive.zip',
      fileKey: 'storage/tenant-1/files/archive.zip',
      path: '/archive.zip',
      size: zipBuffer.length,
      mimeType: 'application/x-zip-compressed',
      fileType: 'archive',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: zipFile.id.toString(),
      userId: 'user-1',
    });

    expect(result.files).toHaveLength(1);
  });
});
