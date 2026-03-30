import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ChartOfAccountDTO,
  chartOfAccountToDTO,
} from '@/mappers/finance/chart-of-account/chart-of-account-to-dto';
import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';

interface GetChartOfAccountByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetChartOfAccountByIdUseCaseResponse {
  chartOfAccount: ChartOfAccountDTO;
}

export class GetChartOfAccountByIdUseCase {
  constructor(private chartOfAccountsRepository: ChartOfAccountsRepository) {}

  async execute({
    tenantId,
    id,
  }: GetChartOfAccountByIdUseCaseRequest): Promise<GetChartOfAccountByIdUseCaseResponse> {
    const chartOfAccount = await this.chartOfAccountsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!chartOfAccount) {
      throw new ResourceNotFoundError(
        'Conta contábil não encontrada',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    return { chartOfAccount: chartOfAccountToDTO(chartOfAccount) };
  }
}
