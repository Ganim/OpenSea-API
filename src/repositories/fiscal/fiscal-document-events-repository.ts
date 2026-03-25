import type { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';

export interface FiscalDocumentEventsRepository {
  findByDocumentId(documentId: string): Promise<FiscalDocumentEvent[]>;
  create(event: FiscalDocumentEvent): Promise<void>;
}
