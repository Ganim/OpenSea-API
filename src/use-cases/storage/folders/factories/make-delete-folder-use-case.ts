import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { DeleteFolderUseCase } from '../delete-folder';

export function makeDeleteFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const storageFilesRepository = new PrismaStorageFilesRepository();
  return new DeleteFolderUseCase(
    storageFoldersRepository,
    storageFilesRepository,
  );
}
