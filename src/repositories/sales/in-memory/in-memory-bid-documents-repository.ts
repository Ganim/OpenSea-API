import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidDocument } from '@/entities/sales/bid-document';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidDocumentsRepository,
  FindManyBidDocumentsPaginatedParams,
} from '@/repositories/sales/bid-documents-repository';

export class InMemoryBidDocumentsRepository implements BidDocumentsRepository {
  public items: BidDocument[] = [];

  async create(doc: BidDocument): Promise<void> {
    this.items.push(doc);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidDocument | null> {
    return (
      this.items.find(
        (d) =>
          d.id.toString() === id.toString() &&
          d.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyBidDocumentsPaginatedParams,
  ): Promise<PaginatedResult<BidDocument>> {
    let filtered = this.items.filter(
      (d) => d.tenantId.toString() === params.tenantId,
    );

    if (params.bidId) {
      filtered = filtered.filter((d) => d.bidId?.toString() === params.bidId);
    }
    if (params.type) {
      filtered = filtered.filter((d) => d.type === params.type);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(doc: BidDocument): Promise<void> {
    const index = this.items.findIndex(
      (d) => d.id.toString() === doc.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = doc;
    }
  }
}
