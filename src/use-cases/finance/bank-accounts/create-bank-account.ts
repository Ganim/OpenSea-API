import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type BankAccountDTO,
  bankAccountToDTO,
} from '@/mappers/finance/bank-account/bank-account-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface CreateBankAccountUseCaseRequest {
  tenantId: string;
  companyId?: string;
  name: string;
  bankCode: string;
  bankName?: string;
  agency: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit?: string;
  accountType: string;
  pixKeyType?: string;
  pixKey?: string;
  color?: string;
  isDefault?: boolean;
}

interface CreateBankAccountUseCaseResponse {
  bankAccount: BankAccountDTO;
}

export class CreateBankAccountUseCase {
  constructor(private bankAccountsRepository: BankAccountsRepository) {}

  async execute(
    request: CreateBankAccountUseCaseRequest,
  ): Promise<CreateBankAccountUseCaseResponse> {
    const { name, bankCode, agency, accountNumber } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError(
        'Bank account name is required',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (name.length > 128) {
      throw new BadRequestError(
        'Bank account name must be at most 128 characters',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (!bankCode || bankCode.trim().length === 0) {
      throw new BadRequestError(
        'Bank code is required',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (!agency || agency.trim().length === 0) {
      throw new BadRequestError('Agency is required', ErrorCodes.BAD_REQUEST);
    }

    if (!accountNumber || accountNumber.trim().length === 0) {
      throw new BadRequestError(
        'Account number is required',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const bankAccount = await this.bankAccountsRepository.create({
      tenantId: request.tenantId,
      companyId: request.companyId,
      name: name.trim(),
      bankCode: bankCode.trim(),
      bankName: request.bankName,
      agency: agency.trim(),
      agencyDigit: request.agencyDigit,
      accountNumber: accountNumber.trim(),
      accountDigit: request.accountDigit,
      accountType: request.accountType,
      pixKeyType: request.pixKeyType,
      pixKey: request.pixKey,
      color: request.color,
      isDefault: request.isDefault,
    });

    return { bankAccount: bankAccountToDTO(bankAccount) };
  }
}
