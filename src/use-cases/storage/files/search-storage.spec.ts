import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { CreateFolderUseCase } from '@/use-cases/storage/folders/create-folder';
import { beforeEach, describe, expect, it } from 'vitest';
import { SearchStorageUseCase } from './search-storage';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let sut: SearchStorageUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('SearchStorageUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    sut = new SearchStorageUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should return empty results for short queries', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID, query: 'a' });
    expect(result.files).toHaveLength(0);
    expect(result.folders).toHaveLength(0);
  });

  it('should return empty results for empty query', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID, query: '' });
    expect(result.files).toHaveLength(0);
    expect(result.folders).toHaveLength(0);
  });

  it('should find files by name', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Docs',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'relatorio-anual.pdf',
      originalName: 'relatorio-anual.pdf',
      fileKey: 'files/relatorio.pdf',
      path: '/docs/relatorio-anual.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'foto.jpg',
      originalName: 'foto.jpg',
      fileKey: 'files/foto.jpg',
      path: '/docs/foto.jpg',
      size: 512,
      mimeType: 'image/jpeg',
      fileType: 'IMAGE',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'relatorio',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('relatorio-anual.pdf');
    expect(result.totalFiles).toBe(1);
  });

  it('should find folders by name', async () => {
    await createFolder.execute({ tenantId: TENANT_ID, name: 'Documentos' });
    await createFolder.execute({ tenantId: TENANT_ID, name: 'Imagens' });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'Documento',
    });

    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].name).toBe('Documentos');
  });

  it('should find both files and folders', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Relatorios',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'relatorio-mensal.pdf',
      originalName: 'relatorio-mensal.pdf',
      fileKey: 'files/rel.pdf',
      path: '/relatorios/relatorio-mensal.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'relatori',
    });

    expect(result.files).toHaveLength(1);
    expect(result.folders).toHaveLength(1);
  });

  it('should not return results from other tenants', async () => {
    await createFolder.execute({ tenantId: 'other-tenant', name: 'Secret' });
    await createFolder.execute({ tenantId: TENANT_ID, name: 'Secret' });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'Secret',
    });

    expect(result.folders).toHaveLength(1);
  });

  it('should filter files by fileType', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Mixed',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'doc.pdf',
      originalName: 'doc.pdf',
      fileKey: 'files/doc.pdf',
      path: '/mixed/doc.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      uploadedBy: 'user-1',
    });

    await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'doc-image.png',
      originalName: 'doc-image.png',
      fileKey: 'files/doc-image.png',
      path: '/mixed/doc-image.png',
      size: 512,
      mimeType: 'image/png',
      fileType: 'IMAGE',
      uploadedBy: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      query: 'doc',
      fileType: 'DOCUMENT',
    });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('doc.pdf');
  });
});
