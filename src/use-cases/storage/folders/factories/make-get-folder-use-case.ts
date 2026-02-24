import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { GetFolderUseCase } from '../get-folder';

export function makeGetFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new GetFolderUseCase(storageFoldersRepository);
}
