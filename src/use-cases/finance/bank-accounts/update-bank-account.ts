import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type BankAccountDTO,
  bankAccountToDTO,
} from '@/mappers/finance/bank-account/bank-account-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface UpdateBankAccountUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: string;
  status?: string;
  pixKeyType?: string;
  pixKey?: string;
  color?: string;
  isDefault?: boolean;
  chartOfAccountId?: string | null;
}

interface UpdateBankAccountUseCaseResponse {
  bankAccount: BankAccountDTO;
}

export class UpdateBankAccountUseCase {
  constructor(private bankAccountsRepository: BankAccountsRepository) {}

  async execute(
    request: UpdateBankAccountUseCaseRequest,
  ): Promise<UpdateBankAccountUseCaseResponse> {
    const { tenantId, id, name } = request;

    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!bankAccount) {
      throw new ResourceNotFoundError(
        'Bank account not found',
        ErrorCodes.FINANCE_BANK_ACCOUNT_NOT_FOUND,
      );
    }

    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new BadRequestError(
          'Bank account name cannot be empty',
          ErrorCodes.BAD_REQUEST,
        );
      }
      if (name.length > 128) {
        throw new BadRequestError(
          'Bank account name must be at most 128 characters',
          ErrorCodes.BAD_REQUEST,
        );
      }
    }

    const updated = await this.bankAccountsRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      name: name?.trim(),
      bankName: request.bankName,
      agency: request.agency,
      agencyDigit: request.agencyDigit,
      accountNumber: request.accountNumber,
      accountDigit: request.accountDigit,
      accountType: request.accountType,
      status: request.status,
      pixKeyType: request.pixKeyType,
      pixKey: request.pixKey,
      color: request.color,
      isDefault: request.isDefault,
      chartOfAccountId: request.chartOfAccountId,
    });

    if (!updated) {
      throw new ResourceNotFoundError(
        'Bank account not found',
        ErrorCodes.FINANCE_BANK_ACCOUNT_NOT_FOUND,
      );
    }

    return {
      bankAccount: bankAccountToDTO(updated, { maskSensitiveData: false }),
    };
  }
}
