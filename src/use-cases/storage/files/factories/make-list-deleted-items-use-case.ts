import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { ListDeletedItemsUseCase } from '../list-deleted-items';

export function makeListDeletedItemsUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new ListDeletedItemsUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
