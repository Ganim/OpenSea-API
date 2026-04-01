import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import type { AccountBalance } from '@/services/banking/banking-provider.interface';

interface GetBankAccountBalanceRequest {
  tenantId: string;
  bankAccountId: string;
}

interface GetBankAccountBalanceResponse {
  balance: AccountBalance;
}

export class GetBankAccountBalanceUseCase {
  constructor(
    private bankAccountsRepository: BankAccountsRepository,
    private getBankingProvider: typeof getBankingProviderForAccount,
  ) {}

  async execute(
    request: GetBankAccountBalanceRequest,
  ): Promise<GetBankAccountBalanceResponse> {
    const { tenantId, bankAccountId } = request;

    // Verify the bank account belongs to this tenant
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError(
        'Bank account not found',
        ErrorCodes.FINANCE_BANK_ACCOUNT_NOT_FOUND,
      );
    }

    // Check apiEnabled via Prisma since the domain entity doesn't expose this field
    const raw = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      select: { apiEnabled: true, accountNumber: true },
    });

    if (!raw?.apiEnabled) {
      throw new BadRequestError(
        'Banking API integration is not enabled for this account',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const provider = await this.getBankingProvider(bankAccountId);
    await provider.authenticate();

    const balance = await provider.getBalance(raw.accountNumber);

    return { balance };
  }
}
