import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnhideItemUseCase } from './unhide-item';

const TENANT_ID = 'tenant-1';

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let sut: UnhideItemUseCase;

describe('UnhideItemUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    sut = new UnhideItemUseCase(
      storageFilesRepository,
      storageFoldersRepository,
    );
  });

  it('should unhide a file', async () => {
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

    await storageFilesRepository.update({
      id: file.id,
      isHidden: true,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: file.id.toString(),
      itemType: 'file',
    });

    const updatedFile = storageFilesRepository.items[0];
    expect(updatedFile.props.isHidden).toBe(false);
  });

  it('should unhide a folder', async () => {
    await storageFoldersRepository.create({
      tenantId: TENANT_ID,
      name: 'Private',
      slug: 'private',
      path: '/private',
    });

    const folder = storageFoldersRepository.items[0];
    await storageFoldersRepository.update({
      id: folder.id,
      isHidden: true,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      itemId: folder.id.toString(),
      itemType: 'folder',
    });

    const updatedFolder = storageFoldersRepository.items[0];
    expect(updatedFolder.isHidden).toBe(false);
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
