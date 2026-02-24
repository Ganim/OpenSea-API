import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { GetFilterFolderContentsUseCase } from '../get-filter-folder-contents';

export function makeGetFilterFolderContentsUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const storageFilesRepository = new PrismaStorageFilesRepository();

  return new GetFilterFolderContentsUseCase(
    storageFoldersRepository,
    storageFilesRepository,
  );
}
