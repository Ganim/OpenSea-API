import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import type { HealthCheckResult } from '@/services/banking/banking-provider.interface';

interface GetBankAccountHealthRequest {
  tenantId: string;
  bankAccountId: string;
}

interface GetBankAccountHealthResponse {
  health: HealthCheckResult;
}

export class GetBankAccountHealthUseCase {
  constructor(
    private bankAccountsRepository: BankAccountsRepository,
    private getBankingProvider: typeof getBankingProviderForAccount,
  ) {}

  async execute(
    request: GetBankAccountHealthRequest,
  ): Promise<GetBankAccountHealthResponse> {
    const { tenantId, bankAccountId } = request;

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

    const raw = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      select: { apiEnabled: true, accountNumber: true },
    });

    if (!raw?.apiEnabled) {
      throw new BadRequestError(
        'A integracao bancaria nao esta habilitada para esta conta',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const provider = await this.getBankingProvider(bankAccountId);
    const health = await provider.healthCheck(raw.accountNumber);

    return { health };
  }
}
