import { PrismaStorageShareLinksRepository } from '@/repositories/storage/prisma/prisma-storage-share-links-repository';
import { RevokeShareLinkUseCase } from '../revoke-share-link';

export function makeRevokeShareLinkUseCase() {
  const storageShareLinksRepository = new PrismaStorageShareLinksRepository();

  return new RevokeShareLinkUseCase(storageShareLinksRepository);
}
