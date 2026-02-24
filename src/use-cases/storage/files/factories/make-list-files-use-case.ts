import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { ListFilesUseCase } from '../list-files';

export function makeListFilesUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  return new ListFilesUseCase(storageFilesRepository);
}
