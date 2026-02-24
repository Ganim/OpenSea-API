import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { PropagateAccessToChildrenUseCase } from '../propagate-access-to-children';

export function makePropagateAccessToChildrenUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();

  return new PropagateAccessToChildrenUseCase(
    storageFoldersRepository,
    folderAccessRulesRepository,
  );
}
