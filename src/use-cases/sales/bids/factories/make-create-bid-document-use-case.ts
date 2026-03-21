import { PrismaBidDocumentsRepository } from '@/repositories/sales/prisma/prisma-bid-documents-repository';
import { CreateBidDocumentUseCase } from '@/use-cases/sales/bids/create-bid-document';

export function makeCreateBidDocumentUseCase() {
  return new CreateBidDocumentUseCase(new PrismaBidDocumentsRepository());
}
