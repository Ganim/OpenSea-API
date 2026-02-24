import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFolderUseCase } from './create-folder';
import { UpdateFolderUseCase } from './update-folder';

let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: UpdateFolderUseCase;
let createFolder: CreateFolderUseCase;

const TENANT_ID = 'tenant-1';

describe('UpdateFolderUseCase', () => {
  beforeEach(() => {
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new UpdateFolderUseCase(storageFoldersRepository);
    createFolder = new CreateFolderUseCase(storageFoldersRepository);
  });

  it('should update folder color', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'My Folder',
    });

    const { folder: updatedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: createdFolder.id.toString(),
      color: '#FF5733',
    });

    expect(updatedFolder.color).toBe('#FF5733');
    expect(updatedFolder.name).toBe('My Folder');
  });

  it('should update folder icon', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'My Folder',
    });

    const { folder: updatedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: createdFolder.id.toString(),
      icon: 'folder-heart',
    });

    expect(updatedFolder.icon).toBe('folder-heart');
    expect(updatedFolder.name).toBe('My Folder');
  });

  it('should set color to null (remove color)', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Colored Folder',
      color: '#FF5733',
    });

    expect(createdFolder.color).toBe('#FF5733');

    const { folder: updatedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: createdFolder.id.toString(),
      color: null,
    });

    expect(updatedFolder.color).toBeNull();
  });

  it('should set icon to null (remove icon)', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'Icon Folder',
      icon: 'folder-star',
    });

    expect(createdFolder.icon).toBe('folder-star');

    const { folder: updatedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: createdFolder.id.toString(),
      icon: null,
    });

    expect(updatedFolder.icon).toBeNull();
  });

  it('should update both color and icon at once', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'My Folder',
    });

    const { folder: updatedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: createdFolder.id.toString(),
      color: '#3B82F6',
      icon: 'folder-lock',
    });

    expect(updatedFolder.color).toBe('#3B82F6');
    expect(updatedFolder.icon).toBe('folder-lock');
  });

  it('should not modify fields that are not provided', async () => {
    const { folder: createdFolder } = await createFolder.execute({
      tenantId: TENANT_ID,
      name: 'My Folder',
      color: '#FF5733',
      icon: 'folder-heart',
    });

    const { folder: updatedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: createdFolder.id.toString(),
      color: '#00FF00',
    });

    expect(updatedFolder.color).toBe('#00FF00');
    expect(updatedFolder.icon).toBe('folder-heart');
  });

  it('should throw ResourceNotFoundError for non-existent folder', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        folderId: 'non-existent-folder-id',
        color: '#FF5733',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should allow updating color and icon of system folders', async () => {
    const systemFolder = await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'System Folder',
      slug: 'system-folder',
      path: '/system-folder',
      isSystem: true,
    });

    const { folder: updatedFolder } = await sut.execute({
      tenantId: TENANT_ID,
      folderId: systemFolder.id.toString(),
      color: '#FF0000',
      icon: 'shield',
    });

    expect(updatedFolder.color).toBe('#FF0000');
    expect(updatedFolder.icon).toBe('shield');
  });
});
