import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { GetFolderUseCase } from './get-folder';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: GetFolderUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('GetFolderUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new GetFolderUseCase(storageFoldersRepository);
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should get a folder by id', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    const { folder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: createdFolder.id.toString(),
    });

    expect(folder.name).toBe('Documents');
    expect(folder.id.toString()).toBe(createdFolder.id.toString());
  });

  it('should throw error if folder not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find folder from different tenant', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Documents',
    });

    await expect(
      sut.execute({
        tenantId: 'different-tenant',
        folderId: createdFolder.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
