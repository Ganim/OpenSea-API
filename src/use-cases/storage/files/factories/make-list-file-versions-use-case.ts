import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { ListFileVersionsUseCase } from '../list-file-versions';

export function makeListFileVersionsUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();

  return new ListFileVersionsUseCase(
    storageFilesRepository,
    storageFileVersionsRepository,
  );
}
