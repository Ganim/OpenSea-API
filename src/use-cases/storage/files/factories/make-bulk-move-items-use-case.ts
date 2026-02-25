import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { BulkMoveItemsUseCase } from '../bulk-move-items';

export function makeBulkMoveItemsUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new BulkMoveItemsUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
