import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { GetStorageStatsUseCase } from '../get-storage-stats';

export function makeGetStorageStatsUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  return new GetStorageStatsUseCase(storageFilesRepository);
}
