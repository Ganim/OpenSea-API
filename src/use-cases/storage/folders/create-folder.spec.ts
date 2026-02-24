import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('CreateFolderUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should create a root folder', async () => {
    const { folder } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    expect(folder.name).toBe('Documents');
    expect(folder.slug).toBe('documents');
    expect(folder.path).toBe('/documents');
    expect(folder.depth).toBe(0);
    expect(folder.parentId).toBeNull();
    expect(folder.tenantId.toString()).toBe(TENANT_ID);
  });

  it('should create a child folder', async () => {
    const { folder: parentFolder } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const { folder: childFolder } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Invoices',
      parentId: parentFolder.id.toString(),
    });

    expect(childFolder.name).toBe('Invoices');
    expect(childFolder.slug).toBe('invoices');
    expect(childFolder.path).toBe('/documents/invoices');
    expect(childFolder.depth).toBe(1);
    expect(childFolder.parentId?.toString()).toBe(parentFolder.id.toString());
  });

  it('should create a deeply nested folder', async () => {
    const { folder: level0 } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Root Folder',
    });

    const { folder: level1 } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Level 1',
      parentId: level0.id.toString(),
    });

    const { folder: level2 } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Level 2',
      parentId: level1.id.toString(),
    });

    expect(level2.path).toBe('/root-folder/level-1/level-2');
    expect(level2.depth).toBe(2);
  });

  it('should slugify folder name with accents', async () => {
    const { folder } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Documentação Técnica',
    });

    expect(folder.slug).toBe('documentacao-tecnica');
    expect(folder.path).toBe('/documentacao-tecnica');
  });

  it('should trim folder name', async () => {
    const { folder } = await sut.execute({
      tenantId: TENANT_ID,
      name: '  My Folder  ',
    });

    expect(folder.name).toBe('My Folder');
  });

  it('should not create a folder with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a folder with whitespace-only name', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '   ',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a folder with name longer than 256 characters', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'a'.repeat(257),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a folder with non-existent parent', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Orphan Folder',
        parentId: 'non-existent-parent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not create duplicate folder name in same parent', async () => {
    const { folder: parentFolder } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Child',
        parentId: parentFolder.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create duplicate folder name at root level', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Documents',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow same name in different parents', async () => {
    const { folder: parent1 } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Parent A',
    });

    const { folder: parent2 } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Parent B',
    });

    const { folder: child1 } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Shared Name',
      parentId: parent1.id.toString(),
    });

    const { folder: child2 } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Shared Name',
      parentId: parent2.id.toString(),
    });

    expect(child1.name).toBe('Shared Name');
    expect(child2.name).toBe('Shared Name');
    expect(child1.path).not.toBe(child2.path);
  });
});
