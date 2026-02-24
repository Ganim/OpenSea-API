import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { GetFileUseCase } from '../get-file';

export function makeGetFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();

  return new GetFileUseCase(
    storageFilesRepository,
    storageFileVersionsRepository,
  );
}
