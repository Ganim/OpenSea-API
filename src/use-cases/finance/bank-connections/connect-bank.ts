import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type {
  BankConnectionRecord,
  BankConnectionsRepository,
} from '@/repositories/finance/bank-connections-repository';
import type { BankingProvider } from '@/services/banking/pluggy-provider.interface';

interface ConnectBankUseCaseRequest {
  tenantId: string;
  bankAccountId: string;
  externalItemId: string;
}

interface ConnectBankUseCaseResponse {
  connection: BankConnectionRecord;
}

// P2-13: per-tenant rate limit. A reasonable ceiling for SMB ERPs (most
// tenants bank with 2-5 institutions). The cap guards against runaway
// fan-out to Pluggy/Sicoob/etc., which costs money per active item and
// burns tokens/quotas on every sync cron.
const MAX_ACTIVE_BANK_CONNECTIONS_PER_TENANT = 10;

export class ConnectBankUseCase {
  constructor(
    private bankAccountsRepository: BankAccountsRepository,
    private bankConnectionsRepository: BankConnectionsRepository,
    private bankingProvider: BankingProvider,
  ) {}

  async execute(
    request: ConnectBankUseCaseRequest,
  ): Promise<ConnectBankUseCaseResponse> {
    const { tenantId, bankAccountId, externalItemId } = request;

    // Validate bank account exists
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError(
        'Bank account not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Check if there's already an active connection
    const existingConnection =
      await this.bankConnectionsRepository.findByBankAccountId(
        bankAccountId,
        tenantId,
      );

    if (existingConnection) {
      throw new BadRequestError(
        'Bank account already has an active connection',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // P2-13: per-tenant rate limit on ACTIVE connections. Placed AFTER the
    // bank-account-already-connected check so the caller gets the more
    // specific error first.
    const activeConnectionsCount =
      await this.bankConnectionsRepository.countActiveByTenant(tenantId);

    if (activeConnectionsCount >= MAX_ACTIVE_BANK_CONNECTIONS_PER_TENANT) {
      throw new BadRequestError(
        `Limite de ${MAX_ACTIVE_BANK_CONNECTIONS_PER_TENANT} conexões bancárias ativas atingido`,
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Validate item with provider
    const item = await this.bankingProvider.getItem(externalItemId);

    if (item.status === 'LOGIN_ERROR') {
      throw new BadRequestError(
        'Bank connection failed - login error',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Create connection record
    const connection = await this.bankConnectionsRepository.create({
      tenantId,
      bankAccountId,
      externalItemId,
      accessToken: externalItemId, // Pluggy uses itemId as reference
    });

    return { connection };
  }
}
