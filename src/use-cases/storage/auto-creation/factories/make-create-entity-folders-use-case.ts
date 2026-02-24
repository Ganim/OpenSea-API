import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { CreateEntityFoldersUseCase } from '../create-entity-folders';

export function makeCreateEntityFoldersUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new CreateEntityFoldersUseCase(storageFoldersRepository);
}
