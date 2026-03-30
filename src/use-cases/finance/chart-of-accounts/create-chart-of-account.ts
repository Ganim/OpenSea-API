import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ChartOfAccountDTO,
  chartOfAccountToDTO,
} from '@/mappers/finance/chart-of-account/chart-of-account-to-dto';
import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';

const CHART_OF_ACCOUNT_CODE_REGEX = /^\d+(\.\d+)*$/;

interface CreateChartOfAccountUseCaseRequest {
  tenantId: string;
  code: string;
  name: string;
  type: string;
  accountClass: string;
  nature: string;
  parentId?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

interface CreateChartOfAccountUseCaseResponse {
  chartOfAccount: ChartOfAccountDTO;
}

export class CreateChartOfAccountUseCase {
  constructor(private chartOfAccountsRepository: ChartOfAccountsRepository) {}

  async execute(
    request: CreateChartOfAccountUseCaseRequest,
  ): Promise<CreateChartOfAccountUseCaseResponse> {
    const { tenantId, code, name, type, accountClass, nature, parentId } =
      request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError(
        'O nome da conta é obrigatório',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (name.length > 128) {
      throw new BadRequestError(
        'O nome da conta deve ter no máximo 128 caracteres',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (!code || code.trim().length === 0) {
      throw new BadRequestError(
        'O código da conta é obrigatório',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (!CHART_OF_ACCOUNT_CODE_REGEX.test(code)) {
      throw new BadRequestError(
        'O código da conta deve seguir o formato hierárquico (ex: 1.1.1.01)',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const existingAccount = await this.chartOfAccountsRepository.findByCode(
      code,
      tenantId,
    );
    if (existingAccount) {
      throw new BadRequestError(
        'Já existe uma conta com este código',
        ErrorCodes.CONFLICT,
      );
    }

    if (parentId) {
      const parentAccount = await this.chartOfAccountsRepository.findById(
        new UniqueEntityID(parentId),
        tenantId,
      );
      if (!parentAccount) {
        throw new BadRequestError(
          'A conta pai não foi encontrada',
          ErrorCodes.RESOURCE_NOT_FOUND,
        );
      }
      if (parentAccount.type !== type) {
        throw new BadRequestError(
          'O tipo da conta filha deve ser igual ao da conta pai',
          ErrorCodes.BAD_REQUEST,
        );
      }
    }

    const chartOfAccount = await this.chartOfAccountsRepository.create({
      tenantId,
      code: code.trim(),
      name: name.trim(),
      type,
      accountClass,
      nature,
      parentId,
      isActive: request.isActive,
      isSystem: request.isSystem,
    });

    return { chartOfAccount: chartOfAccountToDTO(chartOfAccount) };
  }
}
