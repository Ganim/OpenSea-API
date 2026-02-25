import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { RestoreFolderUseCase } from '../restore-folder';

export function makeRestoreFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const storageFilesRepository = new PrismaStorageFilesRepository();
  return new RestoreFolderUseCase(
    storageFoldersRepository,
    storageFilesRepository,
  );
}
