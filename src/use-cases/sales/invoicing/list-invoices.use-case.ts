import type { Invoice } from '@/entities/sales/invoice';
import type {
  InvoicesRepository,
  ListInvoicesFilters,
} from '@/repositories/sales/invoices-repository';

interface ListInvoicesUseCaseRequest {
  tenantId: string;
  status?: 'PENDING' | 'ISSUED' | 'CANCELLED' | 'ERROR';
  orderId?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
}

interface InvoiceListItemDTO {
  id: string;
  orderId: string;
  type: 'NFE' | 'NFCE';
  number: string;
  series: string;
  accessKey: string;
  status: 'PENDING' | 'ISSUED' | 'CANCELLED' | 'ERROR';
  issuedAt?: Date;
  createdAt: Date;
}

interface ListInvoicesUseCaseResponse {
  data: InvoiceListItemDTO[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ListInvoicesUseCase {
  constructor(private invoicesRepository: InvoicesRepository) {}

  async execute(
    request: ListInvoicesUseCaseRequest,
  ): Promise<ListInvoicesUseCaseResponse> {
    // Validações
    if (request.page < 1) {
      throw new Error('Page must be >= 1');
    }

    if (request.limit < 1 || request.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    // Converte filters
    const filters: ListInvoicesFilters = {};

    if (request.status) {
      filters.status = request.status;
    }

    if (request.orderId) {
      filters.orderId = request.orderId;
    }

    if (request.fromDate) {
      filters.fromDate = new Date(request.fromDate);
    }

    if (request.toDate) {
      filters.toDate = new Date(request.toDate);
    }

    // Busca invoices
    const result = await this.invoicesRepository.listByTenant({
      tenantId: request.tenantId,
      filters,
      page: request.page,
      limit: request.limit,
    });

    // Mapeia para DTO
    const data = result.data.map((invoice: Invoice) => ({
      id: invoice.id.toString(),
      orderId: invoice.orderId.toString(),
      type: invoice.type,
      number: invoice.number,
      series: invoice.series,
      accessKey: invoice.accessKey,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      createdAt: invoice.createdAt,
    }));

    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.totalPages,
    };
  }
}
