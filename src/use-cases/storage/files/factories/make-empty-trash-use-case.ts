import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { EmptyTrashUseCase } from '../empty-trash';

export function makeEmptyTrashUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new EmptyTrashUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
