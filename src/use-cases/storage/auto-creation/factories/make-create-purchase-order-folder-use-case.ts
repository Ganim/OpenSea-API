import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { CreatePurchaseOrderFolderUseCase } from '../create-purchase-order-folder';

export function makeCreatePurchaseOrderFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new CreatePurchaseOrderFolderUseCase(storageFoldersRepository);
}
