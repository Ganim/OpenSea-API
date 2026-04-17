import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ChartOfAccountDTO,
  chartOfAccountToDTO,
} from '@/mappers/finance/chart-of-account/chart-of-account-to-dto';
import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';

const CHART_OF_ACCOUNT_CODE_REGEX = /^\d+(\.\d+)*$/;

interface UpdateChartOfAccountUseCaseRequest {
  tenantId: string;
  id: string;
  code?: string;
  name?: string;
  type?: string;
  accountClass?: string;
  nature?: string;
  parentId?: string | null;
  isActive?: boolean;
}

interface UpdateChartOfAccountUseCaseResponse {
  chartOfAccount: ChartOfAccountDTO;
}

export class UpdateChartOfAccountUseCase {
  constructor(private chartOfAccountsRepository: ChartOfAccountsRepository) {}

  async execute(
    request: UpdateChartOfAccountUseCaseRequest,
  ): Promise<UpdateChartOfAccountUseCaseResponse> {
    const { tenantId, id, name, code } = request;

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

    if (chartOfAccount.isSystem) {
      throw new BadRequestError(
        'Contas do sistema não podem ser alteradas',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new BadRequestError(
          'O nome da conta não pode ser vazio',
          ErrorCodes.BAD_REQUEST,
        );
      }
      if (name.length > 128) {
        throw new BadRequestError(
          'O nome da conta deve ter no máximo 128 caracteres',
          ErrorCodes.BAD_REQUEST,
        );
      }
    }

    if (code !== undefined) {
      if (code.trim().length === 0) {
        throw new BadRequestError(
          'O código da conta não pode ser vazio',
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
      if (existingAccount && !existingAccount.id.equals(chartOfAccount.id)) {
        throw new BadRequestError(
          'Já existe uma conta com este código',
          ErrorCodes.CONFLICT,
        );
      }
    }

    if (request.parentId) {
      const parentAccount = await this.chartOfAccountsRepository.findById(
        new UniqueEntityID(request.parentId),
        tenantId,
      );
      if (!parentAccount) {
        throw new BadRequestError(
          'A conta pai não foi encontrada',
          ErrorCodes.RESOURCE_NOT_FOUND,
        );
      }
      const effectiveType = request.type ?? chartOfAccount.type;
      if (parentAccount.type !== effectiveType) {
        throw new BadRequestError(
          'O tipo da conta filha deve ser igual ao da conta pai',
          ErrorCodes.BAD_REQUEST,
        );
      }
    }

    const updated = await this.chartOfAccountsRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      code: code?.trim(),
      name: name?.trim(),
      type: request.type,
      accountClass: request.accountClass,
      nature: request.nature,
      parentId: request.parentId,
      isActive: request.isActive,
    });

    if (!updated) {
      throw new ResourceNotFoundError(
        'Conta contábil não encontrada',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    return { chartOfAccount: chartOfAccountToDTO(updated) };
  }
}
