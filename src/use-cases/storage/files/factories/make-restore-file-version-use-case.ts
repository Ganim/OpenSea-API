import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { RestoreFileVersionUseCase } from '../restore-file-version';

export function makeRestoreFileVersionUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();

  return new RestoreFileVersionUseCase(
    storageFilesRepository,
    storageFileVersionsRepository,
  );
}
