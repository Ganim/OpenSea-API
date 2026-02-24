import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { ListFolderAccessUseCase } from '../list-folder-access';

export function makeListFolderAccessUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();

  return new ListFolderAccessUseCase(
    storageFoldersRepository,
    folderAccessRulesRepository,
  );
}
