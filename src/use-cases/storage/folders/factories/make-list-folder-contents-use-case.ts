import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { ListFolderContentsUseCase } from '../list-folder-contents';

export function makeListFolderContentsUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();
  return new ListFolderContentsUseCase(
    storageFoldersRepository,
    storageFilesRepository,
    folderAccessRulesRepository,
  );
}
