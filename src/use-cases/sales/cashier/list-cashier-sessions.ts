import type { CashierSessionDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import { cashierSessionToDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';

interface ListCashierSessionsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: 'OPEN' | 'CLOSED' | 'RECONCILED';
}

interface ListCashierSessionsUseCaseResponse {
  cashierSessions: CashierSessionDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListCashierSessionsUseCase {
  constructor(
    private cashierSessionsRepository: CashierSessionsRepository,
  ) {}

  async execute(
    input: ListCashierSessionsUseCaseRequest,
  ): Promise<ListCashierSessionsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [sessions, total] = await Promise.all([
      this.cashierSessionsRepository.findMany(
        page,
        perPage,
        input.tenantId,
        input.status,
      ),
      this.cashierSessionsRepository.countByTenant(
        input.tenantId,
        input.status,
      ),
    ]);

    return {
      cashierSessions: sessions.map((session) =>
        cashierSessionToDTO(session),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
