import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { GetFolderBreadcrumbUseCase } from './get-folder-breadcrumb';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: GetFolderBreadcrumbUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('GetFolderBreadcrumbUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new GetFolderBreadcrumbUseCase(storageFoldersRepository);
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should return breadcrumb for a root folder', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const { breadcrumb } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
    });

    expect(breadcrumb).toHaveLength(1);
    expect(breadcrumb[0].name).toBe('Documents');
    expect(breadcrumb[0].path).toBe('/documents');
  });

  it('should return breadcrumb for a nested folder', async () => {
    const { folder: rootFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Invoices',
      parentId: rootFolder.id.toString(),
    });

    const { breadcrumb } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
    });

    expect(breadcrumb).toHaveLength(2);
    expect(breadcrumb[0].name).toBe('Documents');
    expect(breadcrumb[1].name).toBe('Invoices');
  });

  it('should return breadcrumb for a deeply nested folder', async () => {
    const { folder: level0 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Root',
    });

    const { folder: level1 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Level 1',
      parentId: level0.id.toString(),
    });

    const { folder: level2 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Level 2',
      parentId: level1.id.toString(),
    });

    const { folder: level3 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Level 3',
      parentId: level2.id.toString(),
    });

    const { breadcrumb } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: level3.id.toString(),
    });

    expect(breadcrumb).toHaveLength(4);
    expect(breadcrumb[0].name).toBe('Root');
    expect(breadcrumb[1].name).toBe('Level 1');
    expect(breadcrumb[2].name).toBe('Level 2');
    expect(breadcrumb[3].name).toBe('Level 3');
  });

  it('should return breadcrumb items with correct ids and paths', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    const { breadcrumb } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
    });

    expect(breadcrumb[0].id).toBe(parentFolder.id.toString());
    expect(breadcrumb[0].path).toBe('/parent');
    expect(breadcrumb[1].id).toBe(childFolder.id.toString());
    expect(breadcrumb[1].path).toBe('/parent/child');
  });

  it('should throw error if folder not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
