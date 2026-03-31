import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  BankingProvider,
  PixChargeResult,
} from '@/services/banking/banking-provider.interface';

export interface CreatePixChargeRequest {
  tenantId: string;
  entryId: string;
  bankAccountId: string;
  expiresInSeconds?: number;
}

export interface CreatePixChargeResponse {
  pixCharge: PixChargeResult;
}

export class CreatePixChargeUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private getProvider: (bankAccountId: string) => Promise<BankingProvider>,
  ) {}

  async execute(
    request: CreatePixChargeRequest,
  ): Promise<CreatePixChargeResponse> {
    const { tenantId, entryId, bankAccountId, expiresInSeconds } = request;

    // Validate entry exists and belongs to tenant
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    if (entry.type !== 'RECEIVABLE') {
      throw new BadRequestError(
        'PIX charge creation is only available for receivable entries',
      );
    }

    if (entry.status !== 'PENDING' && entry.status !== 'OVERDUE') {
      throw new BadRequestError(
        'PIX charge can only be created for entries with PENDING or OVERDUE status',
      );
    }

    // Validate bank account exists and has a PIX key configured
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError('Bank account');
    }

    if (!bankAccount.pixKey) {
      throw new BadRequestError(
        'Bank account does not have a PIX key configured',
      );
    }

    const dueDate = entry.dueDate.toISOString().split('T')[0];

    // Get provider, authenticate and create PIX charge
    const provider = await this.getProvider(bankAccountId);
    await provider.authenticate();

    const pixCharge = await provider.createPixCharge({
      amount: entry.expectedAmount,
      pixKey: bankAccount.pixKey,
      description: entry.description,
      expiresInSeconds: expiresInSeconds ?? 86400,
      customerName: entry.customerName ?? undefined,
      customerCpfCnpj: entry.beneficiaryCpfCnpj ?? undefined,
    });

    // Persist PIX charge reference on the entry using pixChargeId
    await this.financeEntriesRepository.update({
      id: new UniqueEntityID(entryId),
      tenantId,
      pixChargeId: pixCharge.txId,
    });

    return { pixCharge };
  }
}
