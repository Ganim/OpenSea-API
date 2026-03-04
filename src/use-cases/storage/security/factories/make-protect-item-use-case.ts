import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { ProtectItemUseCase } from '../protect-item';

export function makeProtectItemUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();

  return new ProtectItemUseCase(
    storageFilesRepository,
    storageFoldersRepository,
  );
}
