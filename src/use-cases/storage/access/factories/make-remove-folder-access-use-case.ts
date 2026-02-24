import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { RemoveFolderAccessUseCase } from '../remove-folder-access';

export function makeRemoveFolderAccessUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();

  return new RemoveFolderAccessUseCase(
    storageFoldersRepository,
    folderAccessRulesRepository,
  );
}
