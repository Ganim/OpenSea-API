import type { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import type { FiscalDocumentsRepository } from '@/repositories/fiscal/fiscal-documents-repository';

interface ListFiscalDocumentsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ListFiscalDocumentsUseCaseResponse {
  documents: FiscalDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListFiscalDocumentsUseCase {
  constructor(private fiscalDocumentsRepository: FiscalDocumentsRepository) {}

  async execute(
    request: ListFiscalDocumentsUseCaseRequest,
  ): Promise<ListFiscalDocumentsUseCaseResponse> {
    const { documents, total } =
      await this.fiscalDocumentsRepository.findByTenantId(request.tenantId, {
        page: request.page,
        limit: request.limit,
        type: request.type,
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate,
      });

    const totalPages = Math.ceil(total / request.limit);

    return {
      documents,
      total,
      page: request.page,
      limit: request.limit,
      totalPages,
    };
  }
}
