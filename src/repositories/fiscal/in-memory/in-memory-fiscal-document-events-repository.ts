import type { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';
import type { FiscalDocumentEventsRepository } from '../fiscal-document-events-repository';

export class InMemoryFiscalDocumentEventsRepository
  implements FiscalDocumentEventsRepository
{
  public items: FiscalDocumentEvent[] = [];

  async findByDocumentId(documentId: string): Promise<FiscalDocumentEvent[]> {
    return this.items.filter(
      (item) => item.fiscalDocumentId.toString() === documentId,
    );
  }

  async create(event: FiscalDocumentEvent): Promise<void> {
    this.items.push(event);
  }
}
