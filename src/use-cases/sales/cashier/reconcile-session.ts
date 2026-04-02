import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierSessionDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import { cashierSessionToDTO } from '@/mappers/sales/cashier/cashier-session-to-dto';
import type { CashierSessionsRepository } from '@/repositories/sales/cashier-sessions-repository';

interface ReconcileSessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
}

interface ReconcileSessionUseCaseResponse {
  cashierSession: CashierSessionDTO;
}

export class ReconcileSessionUseCase {
  constructor(private cashierSessionsRepository: CashierSessionsRepository) {}

  async execute(
    input: ReconcileSessionUseCaseRequest,
  ): Promise<ReconcileSessionUseCaseResponse> {
    const session = await this.cashierSessionsRepository.findById(
      new UniqueEntityID(input.sessionId),
      input.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Cashier session not found.');
    }

    if (session.status !== 'CLOSED') {
      throw new BadRequestError('Only closed sessions can be reconciled.');
    }

    session.reconcile();
    await this.cashierSessionsRepository.save(session);

    return {
      cashierSession: cashierSessionToDTO(session),
    };
  }
}
