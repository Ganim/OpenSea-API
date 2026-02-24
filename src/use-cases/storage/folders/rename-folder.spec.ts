import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { RenameFolderUseCase } from './rename-folder';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: RenameFolderUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('RenameFolderUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new RenameFolderUseCase(storageFoldersRepository);
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should rename a folder', async () => {
    const { folder: originalFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Old Name',
    });

    const { folder: renamedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: originalFolder.id.toString(),
      name: 'New Name',
    });

    expect(renamedFolder.name).toBe('New Name');
    expect(renamedFolder.slug).toBe('new-name');
    expect(renamedFolder.path).toBe('/new-name');
  });

  it('should update child paths when renaming a parent folder', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentFolder.id.toString(),
      name: 'Renamed Parent',
    });

    // Verify child folder path was updated
    const updatedChild = storageFoldersRepository.items.find((item) =>
      item.id.equals(childFolder.id),
    );

    expect(updatedChild?.path).toBe('/renamed-parent/child');
  });

  it('should cascade path updates to deeply nested descendants', async () => {
    const { folder: level0 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Root Folder',
    });

    const { folder: level1 } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Level 1',
      parentId: level0.id.toString(),
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Level 2',
      parentId: level1.id.toString(),
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: level0.id.toString(),
      name: 'Renamed Root',
    });

    const allFolders = storageFoldersRepository.items;
    const level2Folder = allFolders.find((f) => f.name === 'Level 2');

    expect(level2Folder?.path).toBe('/renamed-root/level-1/level-2');
  });

  it('should not rename a system folder', async () => {
    // Create a system folder directly via repository
    const systemFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'System Folder',
      slug: 'system-folder',
      path: '/system-folder',
      isSystem: true,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: systemFolder.id.toString(),
        name: 'New Name',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not rename with empty name', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not rename with name longer than 256 characters', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        name: 'a'.repeat(257),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error if folder not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder-id',
        name: 'New Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not rename to a duplicate name in same parent', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Existing Child',
      parentId: parentFolder.id.toString(),
    });

    const { folder: targetFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Other Child',
      parentId: parentFolder.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: targetFolder.id.toString(),
        name: 'Existing Child',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not rename to a duplicate name at root level', async () => {
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Existing Root',
    });

    const { folder: targetFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Other Root',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: targetFolder.id.toString(),
        name: 'Existing Root',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow renaming to the same name (case change)', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'my folder',
    });

    const { folder: renamedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: folder.id.toString(),
      name: 'My Folder',
    });

    expect(renamedFolder.name).toBe('My Folder');
  });
});
