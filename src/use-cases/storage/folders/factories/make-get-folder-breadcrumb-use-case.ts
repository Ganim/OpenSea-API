import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { GetFolderBreadcrumbUseCase } from '../get-folder-breadcrumb';

export function makeGetFolderBreadcrumbUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new GetFolderBreadcrumbUseCase(storageFoldersRepository);
}
