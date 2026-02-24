import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { MoveFileUseCase } from '../move-file';

export function makeMoveFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new MoveFileUseCase(storageFilesRepository, storageFoldersRepository);
}
