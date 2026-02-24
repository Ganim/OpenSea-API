import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import type {
  FileUploadService,
  UploadResult,
} from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { UploadFileUseCase } from './upload-file';

const TENANT_ID = 'tenant-1';

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
}

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let fileUploadService: FakeFileUploadService;
let sut: UploadFileUseCase;

describe('UploadFileUseCase', () => {
  beforeEach(async () => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();
    fileUploadService = new FakeFileUploadService();

    sut = new UploadFileUseCase(
      storageFoldersRepository,
      storageFilesRepository,
      storageFileVersionsRepository,
      fileUploadService,
    );

    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
    });
  });

  it('should upload a file to an existing folder', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('file content'),
        filename: 'report.pdf',
        mimetype: 'application/pdf',
      },
      uploadedBy: 'user-1',
    });

    expect(result.file.name).toBe('report.pdf');
    expect(result.file.originalName).toBe('report.pdf');
    expect(result.file.fileType).toBe('pdf');
    expect(result.file.mimeType).toBe('application/pdf');
    expect(result.file.currentVersion).toBe(1);
    expect(result.file.tenantId.toString()).toBe(TENANT_ID);
    expect(result.file.folderId.toString()).toBe(folder.id.toString());
    expect(result.version.version).toBe(1);
    expect(result.version.changeNote).toBe('Initial upload');
  });

  it('should upload a file with entity binding', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('image data'),
        filename: 'product-photo.jpg',
        mimetype: 'image/jpeg',
      },
      entityType: 'product',
      entityId: 'product-123',
      uploadedBy: 'user-1',
    });

    expect(result.file.entityType).toBe('product');
    expect(result.file.entityId).toBe('product-123');
    expect(result.file.fileType).toBe('image');
  });

  it('should throw when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder',
        file: {
          buffer: Buffer.from('file content'),
          filename: 'report.pdf',
          mimetype: 'application/pdf',
        },
        uploadedBy: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should create initial version record', async () => {
    const folder = storageFoldersRepository.items[0];

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('spreadsheet data'),
        filename: 'data.xlsx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      uploadedBy: 'user-1',
    });

    expect(storageFileVersionsRepository.items).toHaveLength(1);
    expect(storageFileVersionsRepository.items[0].version).toBe(1);
    expect(storageFileVersionsRepository.items[0].uploadedBy).toBe('user-1');
  });

  it('should use the correct upload prefix', async () => {
    const folder = storageFoldersRepository.items[0];

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      file: {
        buffer: Buffer.from('file content'),
        filename: 'doc.txt',
        mimetype: 'text/plain',
      },
      uploadedBy: 'user-1',
    });

    expect(result.file.fileKey).toContain(`storage/${TENANT_ID}/`);
    expect(result.file.fileKey).toContain(folder.id.toString());
  });
});
