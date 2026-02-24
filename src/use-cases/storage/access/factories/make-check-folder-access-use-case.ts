import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { CheckFolderAccessUseCase } from '../check-folder-access';

export function makeCheckFolderAccessUseCase() {
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();

  return new CheckFolderAccessUseCase(folderAccessRulesRepository);
}
