import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { ApplyFolderTemplateUseCase } from '../apply-folder-template';

export function makeApplyFolderTemplateUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new ApplyFolderTemplateUseCase(storageFoldersRepository);
}
