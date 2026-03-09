import { hash } from 'bcryptjs';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { EncryptionService } from '@/services/storage/encryption-service';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { ServeFileUseCase } from './serve-file';
import type { OfficeConversionService } from '@/services/storage/office-conversion-service';
import { randomBytes } from 'node:crypto';

const TENANT_ID = 'tenant-1';
const FILE_CONTENT = Buffer.from('hello world');

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let fileUploadService: FakeFileUploadService;
let sut: ServeFileUseCase;

describe('ServeFileUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFileVersionsRepository =
      new InMemoryStorageFileVersionsRepository();
    fileUploadService = new FakeFileUploadService();

    fileUploadService.getObject = async () => FILE_CONTENT;

    sut = new ServeFileUseCase(
      storageFilesRepository,
      storageFoldersRepository,
      storageFileVersionsRepository,
      fileUploadService,
    );
  });

  it('should serve a file successfully', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/files/report.pdf',
      path: '/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(result.buffer).toEqual(FILE_CONTENT);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.fileName).toBe('report.pdf');
    expect(result.size).toBe(FILE_CONTENT.length);
  });

  it('should throw ResourceNotFoundError for non-existent file', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should serve a specific version of the file', async () => {
    const versionBuffer = Buffer.from('version-1-content');

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/files/report-v2.pdf',
      path: '/report.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFileVersionsRepository.create({
      fileId: file.id.toString(),
      version: 1,
      fileKey: 'storage/tenant-1/files/report-v1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    fileUploadService.getObject = async (key: string) => {
      if (key.includes('v1')) return versionBuffer;
      return FILE_CONTENT;
    };

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      version: 1,
    });

    expect(result.buffer).toEqual(versionBuffer);
  });

  it('should fall back to current version when requested version does not exist', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'report.pdf',
      originalName: 'report.pdf',
      fileKey: 'storage/tenant-1/files/report.pdf',
      path: '/report.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    // Request version 99 which doesn't exist — use case falls back to current fileKey
    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      version: 99,
    });

    expect(result.buffer).toEqual(FILE_CONTENT);
  });

  it('should decrypt encrypted files when encryptionService is provided', async () => {
    const hexKey = randomBytes(32).toString('hex');
    const encryptionService = new EncryptionService(hexKey);

    const plaintext = Buffer.from('secret document content');
    const encrypted = encryptionService.encrypt(plaintext);

    fileUploadService.getObject = async () => encrypted;

    const sutWithEncryption = new ServeFileUseCase(
      storageFilesRepository,
      storageFoldersRepository,
      storageFileVersionsRepository,
      fileUploadService,
      undefined,
      encryptionService,
    );

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'secret.pdf',
      originalName: 'secret.pdf',
      fileKey: 'storage/tenant-1/files/secret.pdf',
      path: '/secret.pdf',
      size: encrypted.length,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
      isEncrypted: true,
    });

    const result = await sutWithEncryption.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
    });

    expect(result.buffer).toEqual(plaintext);
  });

  it('should throw PROTECTED when file is protected and no password given', async () => {
    const passwordHash = await hash('my-password', 6);

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'protected.pdf',
      originalName: 'protected.pdf',
      fileKey: 'storage/tenant-1/files/protected.pdf',
      path: '/protected.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    // Set protection via update
    await storageFilesRepository.update({
      id: file.id,
      isProtected: true,
      protectionHash: passwordHash,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: file.id.toString(),
      }),
    ).rejects.toThrow('PROTECTED');
  });

  it('should throw INVALID_PASSWORD when file password is wrong', async () => {
    const passwordHash = await hash('correct-password', 6);

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'protected.pdf',
      originalName: 'protected.pdf',
      fileKey: 'storage/tenant-1/files/protected.pdf',
      path: '/protected.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.update({
      id: file.id,
      isProtected: true,
      protectionHash: passwordHash,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: file.id.toString(),
        password: 'wrong-password',
      }),
    ).rejects.toThrow('INVALID_PASSWORD');
  });

  it('should serve a protected file when correct password is provided', async () => {
    const passwordHash = await hash('correct-password', 6);

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'protected.pdf',
      originalName: 'protected.pdf',
      fileKey: 'storage/tenant-1/files/protected.pdf',
      path: '/protected.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.update({
      id: file.id,
      isProtected: true,
      protectionHash: passwordHash,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      password: 'correct-password',
    });

    expect(result.buffer).toEqual(FILE_CONTENT);
    expect(result.fileName).toBe('protected.pdf');
  });

  it('should check folder-level protection when file itself is not protected', async () => {
    const folderPasswordHash = await hash('folder-pass', 6);

    const folder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      parentId: null,
      name: 'locked-folder',
      slug: 'locked-folder',
      path: '/locked-folder',
      createdBy: 'user-1',
    });

    await storageFoldersRepository.update({
      id: folder.id,
      isProtected: true,
      protectionHash: folderPasswordHash,
    });

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'inside.pdf',
      originalName: 'inside.pdf',
      fileKey: 'storage/tenant-1/files/inside.pdf',
      path: '/locked-folder/inside.pdf',
      size: 512,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    // No password → PROTECTED
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: file.id.toString(),
      }),
    ).rejects.toThrow('PROTECTED');

    // Wrong password → INVALID_PASSWORD
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        fileId: file.id.toString(),
        password: 'wrong',
      }),
    ).rejects.toThrow('INVALID_PASSWORD');

    // Correct password → success
    const result = await sut.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      password: 'folder-pass',
    });

    expect(result.buffer).toEqual(FILE_CONTENT);
  });

  it('should convert office files to PDF when format=pdf and conversionService is available', async () => {
    const pdfBuffer = Buffer.from('fake-pdf-output');

    const fakeOfficeConversion: OfficeConversionService = {
      canConvert: (mimeType: string) =>
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      convertToPdf: async () => pdfBuffer,
    };

    const sutWithConversion = new ServeFileUseCase(
      storageFilesRepository,
      storageFoldersRepository,
      storageFileVersionsRepository,
      fileUploadService,
      fakeOfficeConversion,
    );

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'document.docx',
      originalName: 'document.docx',
      fileKey: 'storage/tenant-1/files/document.docx',
      path: '/document.docx',
      size: 4096,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'document',
      uploadedBy: 'user-1',
    });

    const result = await sutWithConversion.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      format: 'pdf',
    });

    expect(result.mimeType).toBe('application/pdf');
    expect(result.fileName).toBe('document.pdf');
    expect(result.buffer).toEqual(pdfBuffer);
  });

  it('should not convert when format=pdf but file is not convertible', async () => {
    const fakeOfficeConversion: OfficeConversionService = {
      canConvert: () => false,
      convertToPdf: async () => Buffer.alloc(0),
    };

    const sutWithConversion = new ServeFileUseCase(
      storageFilesRepository,
      storageFoldersRepository,
      storageFileVersionsRepository,
      fileUploadService,
      fakeOfficeConversion,
    );

    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'image.png',
      originalName: 'image.png',
      fileKey: 'storage/tenant-1/files/image.png',
      path: '/image.png',
      size: 2048,
      mimeType: 'image/png',
      fileType: 'image',
      uploadedBy: 'user-1',
    });

    const result = await sutWithConversion.execute({
      tenantId: TENANT_ID,
      fileId: file.id.toString(),
      format: 'pdf',
    });

    // Should return original file, not converted
    expect(result.mimeType).toBe('image/png');
    expect(result.fileName).toBe('image.png');
  });
});
