import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { SearchFoldersUseCase } from './search-folders';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: SearchFoldersUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('SearchFoldersUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new SearchFoldersUseCase(storageFoldersRepository);
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should find folders by name (case-insensitive)', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Images',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documentation Archive',
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: 'doc',
    });

    expect(folders).toHaveLength(2);
    const folderNames = folders.map((f) => f.name);
    expect(folderNames).toContain('Documents');
    expect(folderNames).toContain('Documentation Archive');
  });

  it('should find nested folders', async () => {
    const { folder: rootFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Root',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Important Files',
      parentId: rootFolder.id.toString(),
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: 'important',
    });

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe('Important Files');
  });

  it('should return empty results for no matches', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: 'nonexistent',
    });

    expect(folders).toHaveLength(0);
  });

  it('should return empty results for empty query', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: '',
    });

    expect(folders).toHaveLength(0);
  });

  it('should return empty results for whitespace-only query', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: '   ',
    });

    expect(folders).toHaveLength(0);
  });

  it('should search case-insensitively', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Financial Reports',
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: 'FINANCIAL',
    });

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe('Financial Reports');
  });

  it('should not return folders from a different tenant', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'My Folder',
    });

    await createFolder.execute({
      tenantId: 'other-tenant',
      name: 'My Folder',
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: 'My Folder',
    });

    expect(folders).toHaveLength(1);
    expect(folders[0].tenantId.toString()).toBe(TENANT_ID);
  });

  it('should find deeply nested folders', async () => {
    const { folder: level0 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Level 0',
    });

    const { folder: level1 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Level 1',
      parentId: level0.id.toString(),
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Deep Target Folder',
      parentId: level1.id.toString(),
    });

    const { folders } = await sut.execute({
      tenantId: TENANT_ID,
      query: 'target',
    });

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe('Deep Target Folder');
  });
});
