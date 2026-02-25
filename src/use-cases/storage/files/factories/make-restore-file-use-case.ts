import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { RestoreFileUseCase } from '../restore-file';

export function makeRestoreFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new RestoreFileUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
