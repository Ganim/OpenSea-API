import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { BulkDeleteItemsUseCase } from '../bulk-delete-items';

export function makeBulkDeleteItemsUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new BulkDeleteItemsUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
