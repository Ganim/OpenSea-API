import type { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';

export interface FiscalDocumentItemsRepository {
  findByDocumentId(documentId: string): Promise<FiscalDocumentItem[]>;
  createMany(items: FiscalDocumentItem[]): Promise<void>;
}
