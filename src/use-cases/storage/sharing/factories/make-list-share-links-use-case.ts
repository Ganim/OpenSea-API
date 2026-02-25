import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageShareLinksRepository } from '@/repositories/storage/prisma/prisma-storage-share-links-repository';
import { ListShareLinksUseCase } from '../list-share-links';

export function makeListShareLinksUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageShareLinksRepository = new PrismaStorageShareLinksRepository();

  return new ListShareLinksUseCase(
    storageFilesRepository,
    storageShareLinksRepository,
  );
}
