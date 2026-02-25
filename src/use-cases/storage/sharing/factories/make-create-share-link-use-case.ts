import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageShareLinksRepository } from '@/repositories/storage/prisma/prisma-storage-share-links-repository';
import { CreateShareLinkUseCase } from '../create-share-link';

export function makeCreateShareLinkUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageShareLinksRepository = new PrismaStorageShareLinksRepository();

  return new CreateShareLinkUseCase(
    storageFilesRepository,
    storageShareLinksRepository,
  );
}
