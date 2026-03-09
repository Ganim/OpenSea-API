import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { BulkMoveItemsUseCase } from '../bulk-move-items';

export function makeBulkMoveItemsUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const transactionManager = new PrismaTransactionManager();

  return new BulkMoveItemsUseCase(
    storageFilesRepository,
    storageFoldersRepository,
    transactionManager,
  );
}
