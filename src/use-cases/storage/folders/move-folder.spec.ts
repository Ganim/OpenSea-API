import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { MoveFolderUseCase } from './move-folder';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: MoveFolderUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('MoveFolderUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new MoveFolderUseCase(storageFoldersRepository);
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should move a folder to a new parent', async () => {
    const { folder: folderA } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder A',
    });

    const { folder: folderB } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder B',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: folderA.id.toString(),
    });

    const { folder: movedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: childFolder.id.toString(),
      targetParentId: folderB.id.toString(),
    });

    expect(movedFolder.parentId?.toString()).toBe(folderB.id.toString());
    expect(movedFolder.path).toBe('/folder-b/child');
    expect(movedFolder.depth).toBe(1);
  });

  it('should cascade path updates to descendants when moving', async () => {
    const { folder: folderA } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder A',
    });

    const { folder: folderB } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder B',
    });

    const { folder: parentToMove } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent To Move',
      parentId: folderA.id.toString(),
    });

    const { folder: childOfMoved } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Nested Child',
      parentId: parentToMove.id.toString(),
    });

    await sut.execute({
      tenantId: TENANT_ID,
      folderId: parentToMove.id.toString(),
      targetParentId: folderB.id.toString(),
    });

    const updatedChild = storageFoldersRepository.items.find((item) =>
      item.id.equals(childOfMoved.id),
    );

    expect(updatedChild?.path).toBe('/folder-b/parent-to-move/nested-child');
    expect(updatedChild?.depth).toBe(2);
  });

  it('should not move a folder into itself', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Self Folder',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        targetParentId: folder.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not move a folder into one of its descendants', async () => {
    const { folder: parentFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Parent',
    });

    const { folder: childFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Child',
      parentId: parentFolder.id.toString(),
    });

    const { folder: grandchildFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Grandchild',
      parentId: childFolder.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: parentFolder.id.toString(),
        targetParentId: grandchildFolder.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not move when folder does not exist', async () => {
    const { folder: targetParent } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Target',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder-id',
        targetParentId: targetParent.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not move when target parent does not exist', async () => {
    const { folder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: folder.id.toString(),
        targetParentId: 'non-existent-target-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not move when name conflicts in target parent', async () => {
    const { folder: folderA } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder A',
    });

    const { folder: folderB } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Folder B',
    });

    // Create a child named "Conflict" in folderA
    const { folder: childInA } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Conflict',
      parentId: folderA.id.toString(),
    });

    // Create a child named "Conflict" in folderB
    await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Conflict',
      parentId: folderB.id.toString(),
    });

    // Try to move childInA to folderB (name conflict)
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: childInA.id.toString(),
        targetParentId: folderB.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
