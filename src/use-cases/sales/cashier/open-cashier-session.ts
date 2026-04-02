import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { CashierSessionDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import { cashierSessionToDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';

interface OpenCashierSessionUseCaseRequest {
  tenantId: string;
  cashierId: string;
  posTerminalId?: string;
  openingBalance: number;
  notes?: string;
}

interface OpenCashierSessionUseCaseResponse {
  cashierSession: CashierSessionDTO;
}

export class OpenCashierSessionUseCase {
  constructor(private cashierSessionsRepository: CashierSessionsRepository) {}

  async execute(
    input: OpenCashierSessionUseCaseRequest,
  ): Promise<OpenCashierSessionUseCaseResponse> {
    if (input.openingBalance < 0) {
      throw new BadRequestError('Opening balance cannot be negative.');
    }

    const existingOpenSession =
      await this.cashierSessionsRepository.findOpenByCashierId(
        input.cashierId,
        input.tenantId,
      );

    if (existingOpenSession) {
      throw new BadRequestError(
        'This user already has an open cashier session.',
      );
    }

    const session = await this.cashierSessionsRepository.create({
      tenantId: input.tenantId,
      cashierId: input.cashierId,
      posTerminalId: input.posTerminalId,
      openingBalance: input.openingBalance,
      notes: input.notes,
    });

    return {
      cashierSession: cashierSessionToDTO(session),
    };
  }
}
