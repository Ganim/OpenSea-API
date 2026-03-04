import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { UnprotectItemUseCase } from '../unprotect-item';

export function makeUnprotectItemUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new UnprotectItemUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
