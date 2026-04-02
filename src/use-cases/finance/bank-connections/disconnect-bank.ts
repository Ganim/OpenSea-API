import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankConnectionsRepository } from '@/repositories/finance/bank-connections-repository';

interface DisconnectBankUseCaseRequest {
  tenantId: string;
  connectionId: string;
}

export class DisconnectBankUseCase {
  constructor(private bankConnectionsRepository: BankConnectionsRepository) {}

  async execute(request: DisconnectBankUseCaseRequest): Promise<void> {
    const { tenantId, connectionId } = request;

    const connection = await this.bankConnectionsRepository.findById(
      new UniqueEntityID(connectionId),
      tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError(
        'Bank connection not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    await this.bankConnectionsRepository.update({
      id: new UniqueEntityID(connectionId),
      tenantId,
      status: 'REVOKED',
    });
  }
}
