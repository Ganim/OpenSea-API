import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetFilterFolderContentsUseCase } from './get-filter-folder-contents';

const TENANT_ID = new UniqueEntityID().toString();
const OTHER_TENANT_ID = new UniqueEntityID().toString();

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: GetFilterFolderContentsUseCase;

describe('GetFilterFolderContentsUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new GetFilterFolderContentsUseCase(
      storageFoldersRepository,
      storageFilesRepository,
    );
  });

  it('should return files matching filterFileType from ANY folder in the tenant', async () => {
    // Create a filter folder
    const filterFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Boletos (Todos)',
      slug: 'boletos-todos',
      path: '/financeiro/boletos',
      isSystem: true,
      isFilter: true,
      filterFileType: 'BOLETO',
      module: 'finance',
      depth: 1,
    });

    // Create regular folders
    const folderA = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Empresa A',
      slug: 'empresa-a',
      path: '/financeiro/empresa-a',
      depth: 1,
    });

    const folderB = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Empresa B',
      slug: 'empresa-b',
      path: '/financeiro/empresa-b',
      depth: 1,
    });

    // Create BOLETO files across different folders
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folderA.id.toString(),
      name: 'boleto-empresa-a.pdf',
      originalName: 'boleto-empresa-a.pdf',
      fileKey: 'storage/boleto-a.pdf',
      path: '/financeiro/empresa-a/boleto-empresa-a.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'BOLETO',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folderB.id.toString(),
      name: 'boleto-empresa-b.pdf',
      originalName: 'boleto-empresa-b.pdf',
      fileKey: 'storage/boleto-b.pdf',
      path: '/financeiro/empresa-b/boleto-empresa-b.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'BOLETO',
      uploadedBy: 'user-1',
    });

    // Create a non-BOLETO file
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folderA.id.toString(),
      name: 'comprovante.pdf',
      originalName: 'comprovante.pdf',
      fileKey: 'storage/comprovante.pdf',
      path: '/financeiro/empresa-a/comprovante.pdf',
      size: 512,
      mimeType: 'application/pdf',
      fileType: 'COMPROVANTE',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
    });

    expect(result.files).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.files.every((file) => file.fileType === 'BOLETO')).toBe(true);
  });

  it('should return empty when no files match the filter file type', async () => {
    const filterFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Atestados (Todos)',
      slug: 'atestados-todos',
      path: '/recursos-humanos/atestados',
      isSystem: true,
      isFilter: true,
      filterFileType: 'ATESTADO',
      module: 'hr',
      depth: 1,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
    });

    expect(result.files).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.pages).toBe(0);
  });

  it('should throw ResourceNotFoundError for non-existent folder', async () => {
    const nonExistentFolderId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: nonExistentFolderId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if folder is NOT a filter folder', async () => {
    const regularFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Documents',
      slug: 'documents',
      path: '/documents',
      depth: 0,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: regularFolder.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should respect tenant isolation', async () => {
    // Create filter folder for TENANT_ID
    const filterFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Boletos (Todos)',
      slug: 'boletos-todos',
      path: '/financeiro/boletos',
      isSystem: true,
      isFilter: true,
      filterFileType: 'BOLETO',
      module: 'finance',
      depth: 1,
    });

    // Create a folder in OTHER tenant
    const otherFolder = await storageFoldersRepository.create({
      tenantId: OTHER_TENANT_ID,
      name: 'Other Folder',
      slug: 'other-folder',
      path: '/other-folder',
      depth: 0,
    });

    // Create a BOLETO file for TENANT_ID
    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
      name: 'boleto-tenant-1.pdf',
      originalName: 'boleto-tenant-1.pdf',
      fileKey: 'storage/boleto-t1.pdf',
      path: '/financeiro/boleto-tenant-1.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'BOLETO',
      uploadedBy: 'user-1',
    });

    // Create a BOLETO file for OTHER_TENANT_ID
    await storageFilesRepository.create({
      tenantId: OTHER_TENANT_ID,
      folderId: otherFolder.id.toString(),
      name: 'boleto-other-tenant.pdf',
      originalName: 'boleto-other-tenant.pdf',
      fileKey: 'storage/boleto-other.pdf',
      path: '/other-folder/boleto-other-tenant.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'BOLETO',
      uploadedBy: 'user-2',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
    });

    // Should only return the BOLETO from TENANT_ID
    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('boleto-tenant-1.pdf');
  });

  it('should paginate correctly', async () => {
    const filterFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Boletos (Todos)',
      slug: 'boletos-todos',
      path: '/financeiro/boletos',
      isSystem: true,
      isFilter: true,
      filterFileType: 'BOLETO',
      module: 'finance',
      depth: 1,
    });

    const regularFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Financeiro',
      slug: 'financeiro',
      path: '/financeiro',
      depth: 0,
    });

    // Create 5 BOLETO files
    for (let fileIndex = 0; fileIndex < 5; fileIndex++) {
      await storageFilesRepository.create({
        tenantId: TENANT_ID,
        folderId: regularFolder.id.toString(),
        name: `boleto-${fileIndex}.pdf`,
        originalName: `boleto-${fileIndex}.pdf`,
        fileKey: `storage/boleto-${fileIndex}.pdf`,
        path: `/financeiro/boleto-${fileIndex}.pdf`,
        size: 1024 * (fileIndex + 1),
        mimeType: 'application/pdf',
        fileType: 'BOLETO',
        uploadedBy: 'user-1',
      });
    }

    // Page 1 with limit 2
    const page1 = await sut.execute({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
      page: 1,
      limit: 2,
    });

    expect(page1.files).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.page).toBe(1);
    expect(page1.limit).toBe(2);
    expect(page1.pages).toBe(3);

    // Page 3 with limit 2
    const page3 = await sut.execute({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
      page: 3,
      limit: 2,
    });

    expect(page3.files).toHaveLength(1);
    expect(page3.total).toBe(5);
    expect(page3.page).toBe(3);
  });

  it('should use default pagination values', async () => {
    const filterFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Boletos (Todos)',
      slug: 'boletos-todos',
      path: '/financeiro/boletos',
      isSystem: true,
      isFilter: true,
      filterFileType: 'BOLETO',
      module: 'finance',
      depth: 1,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should cap limit at 100', async () => {
    const filterFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Boletos (Todos)',
      slug: 'boletos-todos',
      path: '/financeiro/boletos',
      isSystem: true,
      isFilter: true,
      filterFileType: 'BOLETO',
      module: 'finance',
      depth: 1,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      folderId: filterFolder.id.toString(),
      limit: 200,
    });

    expect(result.limit).toBe(100);
  });
});
