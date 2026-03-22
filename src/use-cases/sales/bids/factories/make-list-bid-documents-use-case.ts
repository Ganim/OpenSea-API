import { PrismaBidDocumentsRepository } from '@/repositories/sales/prisma/prisma-bid-documents-repository';
import { ListBidDocumentsUseCase } from '@/use-cases/sales/bids/list-bid-documents';

export function makeListBidDocumentsUseCase() {
  return new ListBidDocumentsUseCase(new PrismaBidDocumentsRepository());
}
