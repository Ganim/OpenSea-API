import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { PropagateAccessToChildrenUseCase } from '../propagate-access-to-children';
import { SetFolderAccessUseCase } from '../set-folder-access';

export function makeSetFolderAccessUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();

  const propagateAccessToChildrenUseCase = new PropagateAccessToChildrenUseCase(
    storageFoldersRepository,
    folderAccessRulesRepository,
  );

  return new SetFolderAccessUseCase(
    storageFoldersRepository,
    folderAccessRulesRepository,
    propagateAccessToChildrenUseCase,
  );
}
