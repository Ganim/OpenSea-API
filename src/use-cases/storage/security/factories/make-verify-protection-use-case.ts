import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { VerifyProtectionUseCase } from '../verify-protection';

export function makeVerifyProtectionUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new VerifyProtectionUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
