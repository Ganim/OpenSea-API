import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { RenameFileUseCase } from '../rename-file';

export function makeRenameFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new RenameFileUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
