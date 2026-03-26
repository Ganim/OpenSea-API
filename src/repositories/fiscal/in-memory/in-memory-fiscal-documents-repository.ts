import type { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import type {
  FiscalDocumentFilters,
  FiscalDocumentsRepository,
} from '../fiscal-documents-repository';

export class InMemoryFiscalDocumentsRepository
  implements FiscalDocumentsRepository
{
  public items: FiscalDocument[] = [];

  async findById(id: string): Promise<FiscalDocument | null> {
    const document = this.items.find((item) => item.id.toString() === id);
    return document ?? null;
  }

  async findByAccessKey(accessKey: string): Promise<FiscalDocument | null> {
    const document = this.items.find((item) => item.accessKey === accessKey);
    return document ?? null;
  }

  async findByExternalId(externalId: string): Promise<FiscalDocument | null> {
    const document = this.items.find((item) => item.externalId === externalId);
    return document ?? null;
  }

  async findByTenantId(
    tenantId: string,
    params: FiscalDocumentFilters,
  ): Promise<{ documents: FiscalDocument[]; total: number }> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (params.type) {
      filtered = filtered.filter((item) => item.type === params.type);
    }

    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    if (params.startDate) {
      filtered = filtered.filter((item) => item.createdAt >= params.startDate!);
    }

    if (params.endDate) {
      filtered = filtered.filter((item) => item.createdAt <= params.endDate!);
    }

    const total = filtered.length;
    const offset = (params.page - 1) * params.limit;
    const documents = filtered.slice(offset, offset + params.limit);

    return { documents, total };
  }

  async findNextNumber(
    configId: string,
    type: string,
    series: number,
  ): Promise<number> {
    const existingDocuments = this.items.filter(
      (item) =>
        item.configId.toString() === configId &&
        item.type === type &&
        item.series === series,
    );

    if (existingDocuments.length === 0) return 1;

    const maxNumber = Math.max(...existingDocuments.map((doc) => doc.number));
    return maxNumber + 1;
  }

  async create(document: FiscalDocument): Promise<void> {
    this.items.push(document);
  }

  async save(document: FiscalDocument): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(document.id));
    if (index >= 0) {
      this.items[index] = document;
    } else {
      this.items.push(document);
    }
  }
}
