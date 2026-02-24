import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { RenameEntityFoldersUseCase } from '../rename-entity-folders';

export function makeRenameEntityFoldersUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new RenameEntityFoldersUseCase(storageFoldersRepository);
}
