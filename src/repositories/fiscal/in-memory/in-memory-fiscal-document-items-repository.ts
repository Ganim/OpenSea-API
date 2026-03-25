import type { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';
import type { FiscalDocumentItemsRepository } from '../fiscal-document-items-repository';

export class InMemoryFiscalDocumentItemsRepository
  implements FiscalDocumentItemsRepository
{
  public items: FiscalDocumentItem[] = [];

  async findByDocumentId(documentId: string): Promise<FiscalDocumentItem[]> {
    return this.items.filter(
      (item) => item.fiscalDocumentId.toString() === documentId,
    );
  }

  async createMany(items: FiscalDocumentItem[]): Promise<void> {
    this.items.push(...items);
  }
}
