import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type BankAccountDTO,
  bankAccountToDTO,
} from '@/mappers/finance/bank-account/bank-account-to-dto';
import { prisma } from '@/lib/prisma';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface UpdateBankAccountApiConfigRequest {
  tenantId: string;
  bankAccountId: string;
  apiProvider: string;
  apiClientId: string;
  apiCertFileId?: string;
  apiCertKeyFileId?: string;
  apiScopes?: string;
  apiWebhookSecret?: string;
  apiEnabled: boolean;
  userId?: string;
}

interface UpdateBankAccountApiConfigResponse {
  bankAccount: BankAccountDTO;
}

export class UpdateBankAccountApiConfigUseCase {
  constructor(private bankAccountsRepository: BankAccountsRepository) {}

  async execute(
    request: UpdateBankAccountApiConfigRequest,
  ): Promise<UpdateBankAccountApiConfigResponse> {
    const { tenantId, bankAccountId } = request;

    const existing = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError(
        'Bank account not found',
        ErrorCodes.FINANCE_BANK_ACCOUNT_NOT_FOUND,
      );
    }

    // API config fields are not part of the domain entity — update directly via Prisma
    await prisma.bankAccount.update({
      where: { id: bankAccountId, tenantId },
      data: {
        apiProvider: request.apiProvider,
        apiClientId: request.apiClientId,
        apiCertFileId: request.apiCertFileId ?? null,
        apiCertKeyFileId: request.apiCertKeyFileId ?? null,
        apiScopes: request.apiScopes ?? null,
        apiWebhookSecret: request.apiWebhookSecret ?? null,
        apiEnabled: request.apiEnabled,
      },
    });

    // Re-fetch through repository so the returned DTO is consistent
    const updated = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    return {
      bankAccount: bankAccountToDTO(updated!, { maskSensitiveData: false }),
    };
  }
}
