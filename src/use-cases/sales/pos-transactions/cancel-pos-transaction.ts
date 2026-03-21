import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTransaction } from '@/entities/sales/pos-transaction';
import type { PosTransactionsRepository } from '@/repositories/sales/pos-transactions-repository';

interface CancelPosTransactionUseCaseRequest {
  tenantId: string;
  transactionId: string;
}

interface CancelPosTransactionUseCaseResponse {
  transaction: PosTransaction;
}

export class CancelPosTransactionUseCase {
  constructor(private posTransactionsRepository: PosTransactionsRepository) {}

  async execute(
    request: CancelPosTransactionUseCaseRequest,
  ): Promise<CancelPosTransactionUseCaseResponse> {
    const transaction = await this.posTransactionsRepository.findById(
      new UniqueEntityID(request.transactionId),
      request.tenantId,
    );

    if (!transaction) {
      throw new ResourceNotFoundError('Transaction not found.');
    }

    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestError('Only completed transactions can be cancelled.');
    }

    transaction.status = 'CANCELLED';
    await this.posTransactionsRepository.save(transaction);

    return { transaction };
  }
}
