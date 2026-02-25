import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageShareLinksRepository } from '@/repositories/storage/prisma/prisma-storage-share-links-repository';
import { AccessSharedFileUseCase } from '../access-shared-file';

export function makeAccessSharedFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageShareLinksRepository = new PrismaStorageShareLinksRepository();

  return new AccessSharedFileUseCase(
    storageFilesRepository,
    storageShareLinksRepository,
  );
}
