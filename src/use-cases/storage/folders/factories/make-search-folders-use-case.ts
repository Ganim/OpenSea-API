import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { SearchFoldersUseCase } from '../search-folders';

export function makeSearchFoldersUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new SearchFoldersUseCase(storageFoldersRepository);
}
