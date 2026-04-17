import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';

interface DeleteChartOfAccountUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteChartOfAccountUseCase {
  constructor(private chartOfAccountsRepository: ChartOfAccountsRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteChartOfAccountUseCaseRequest): Promise<void> {
    const uniqueId = new UniqueEntityID(id);

    const chartOfAccount = await this.chartOfAccountsRepository.findById(
      uniqueId,
      tenantId,
    );

    if (!chartOfAccount) {
      throw new ResourceNotFoundError(
        'Conta contábil não encontrada',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    if (chartOfAccount.isSystem) {
      throw new BadRequestError(
        'Contas do sistema não podem ser excluídas',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const children = await this.chartOfAccountsRepository.findChildren(
      uniqueId,
      tenantId,
    );

    if (children.length > 0) {
      throw new BadRequestError(
        'Não é possível excluir uma conta que possui subcontas',
        ErrorCodes.BAD_REQUEST,
      );
    }

    await this.chartOfAccountsRepository.delete(uniqueId, tenantId);
  }
}
