import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type { CustomerPortalAccessesRepository } from '@/repositories/finance/customer-portal-accesses-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface ListPortalInvoicesRequest {
  token: string;
  status?: 'pending' | 'paid' | 'all';
  page?: number;
  limit?: number;
}

interface ListPortalInvoicesResponse {
  invoices: FinanceEntry[];
  total: number;
  customerName: string;
}

export class ListPortalInvoicesUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: ListPortalInvoicesRequest,
  ): Promise<ListPortalInvoicesResponse> {
    const { token, status = 'all', page = 1, limit = 20 } = request;

    const access =
      await this.customerPortalAccessesRepository.findByToken(token);

    if (!access) {
      throw new UnauthorizedError('Token de acesso inválido.');
    }

    if (!access.isActive) {
      throw new UnauthorizedError('Acesso ao portal desativado.');
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      throw new UnauthorizedError('Token de acesso expirado.');
    }

    await this.customerPortalAccessesRepository.updateLastAccess(access.id);

    const statusFilter = this.resolveStatusFilter(status);

    const { entries, total } = await this.financeEntriesRepository.findMany({
      tenantId: access.tenantId,
      type: 'RECEIVABLE',
      customerName: access.customerName ?? undefined,
      status: statusFilter,
      page,
      limit,
      sortBy: 'dueDate',
      sortOrder: 'desc',
    });

    return {
      invoices: entries,
      total,
      customerName: access.customerName ?? access.customerId,
    };
  }

  private resolveStatusFilter(
    status: 'pending' | 'paid' | 'all',
  ): string | undefined {
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'paid':
        return 'RECEIVED';
      default:
        return undefined;
    }
  }
}
