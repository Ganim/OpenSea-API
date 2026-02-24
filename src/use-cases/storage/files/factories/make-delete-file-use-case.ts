import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { DeleteFileUseCase } from '../delete-file';

export function makeDeleteFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  return new DeleteFileUseCase(storageFilesRepository);
}
