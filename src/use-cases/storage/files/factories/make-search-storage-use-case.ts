import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { SearchStorageUseCase } from '../search-storage';

export function makeSearchStorageUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new SearchStorageUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
