import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { ArchiveExpiredFilesUseCase } from '../archive-expired-files';

export function makeArchiveExpiredFilesUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  return new ArchiveExpiredFilesUseCase(storageFilesRepository);
}
