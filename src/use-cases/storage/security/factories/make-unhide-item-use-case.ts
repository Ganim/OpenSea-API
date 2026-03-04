import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { UnhideItemUseCase } from '../unhide-item';

export function makeUnhideItemUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new UnhideItemUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
