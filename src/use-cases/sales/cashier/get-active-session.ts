import type { CashierSessionDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import { cashierSessionToDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';

interface GetActiveSessionUseCaseRequest {
  tenantId: string;
  cashierId: string;
}

interface GetActiveSessionUseCaseResponse {
  cashierSession: CashierSessionDTO | null;
}

export class GetActiveSessionUseCase {
  constructor(private cashierSessionsRepository: CashierSessionsRepository) {}

  async execute(
    input: GetActiveSessionUseCaseRequest,
  ): Promise<GetActiveSessionUseCaseResponse> {
    const session = await this.cashierSessionsRepository.findOpenByCashierId(
      input.cashierId,
      input.tenantId,
    );

    return {
      cashierSession: session ? cashierSessionToDTO(session) : null,
    };
  }
}
