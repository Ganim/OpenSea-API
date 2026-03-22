import type { BidDocument } from '@/entities/sales/bid-document';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { BidDocumentsRepository } from '@/repositories/sales/bid-documents-repository';

interface ListBidDocumentsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  bidId?: string;
  type?: string;
}

interface ListBidDocumentsUseCaseResponse {
  documents: BidDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListBidDocumentsUseCase {
  constructor(private bidDocumentsRepository: BidDocumentsRepository) {}

  async execute(request: ListBidDocumentsUseCaseRequest): Promise<ListBidDocumentsUseCaseResponse> {
    const result: PaginatedResult<BidDocument> = await this.bidDocumentsRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      bidId: request.bidId,
      type: request.type,
    });

    return {
      documents: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
