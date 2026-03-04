import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { HideItemUseCase } from './hide-item';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: HideItemUseCase;

describe('HideItemUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new HideItemUseCase(storageFilesRepository, storageFoldersRepository);
  });

  it('should hide a file', async () => {
    const file = await storageFilesRepository.create({
      tenantId: TENANT_ID,
      folderId: null,
      name: 'secret.pdf',
      originalName: 'secret.pdf',
      fileKey: 'storage/tenant-1/secret.pdf',
      path: '/secret.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      fileType: 'pdf',
      uploadedBy: 'user-1',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
    });

    const updatedFile = storageFilesRepository.items[0];
    expect(updatedFile.props.isHidden).toBe(true);
  });

  it('should hide a folder', async () => {
    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Private',
      slug: 'private',
      path: '/private',
    });

    const folder = storageFoldersRepository.items[0];

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: folder.id.toString(),
      itemType: 'folder',
    });

    const updatedFolder = storageFoldersRepository.items[0];
    expect(updatedFolder.isHidden).toBe(true);
  });

  it('should throw ResourceNotFoundError when file does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: 'non-existent',
        itemType: 'file',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when folder does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        itemId: 'non-existent',
        itemType: 'folder',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
