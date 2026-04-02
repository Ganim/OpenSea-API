import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PixCharge } from '@/entities/cashier/pix-charge';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { PixChargesRepository } from '@/repositories/cashier/pix-charges-repository';
import type { PixProvider } from '@/services/cashier/pix-provider.interface';
import { randomUUID } from 'node:crypto';

interface CreatePixChargeForEntryRequest {
  entryId: string;
  tenantId: string;
  expirationSeconds?: number;
  payerCpfCnpj?: string;
  payerName?: string;
}

interface CreatePixChargeForEntryResponse {
  entry: FinanceEntryDTO;
  txId: string;
  pixCopiaECola: string;
  qrCodeUrl: string;
  expiresAt: Date;
  amount: number;
}

export class CreatePixChargeForEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private pixChargesRepository: PixChargesRepository,
    private pixProvider: PixProvider,
  ) {}

  async execute(
    request: CreatePixChargeForEntryRequest,
  ): Promise<CreatePixChargeForEntryResponse> {
    const { entryId, tenantId } = request;

    // Find entry
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    // Validate entry is RECEIVABLE
    if (entry.type !== 'RECEIVABLE') {
      throw new BadRequestError(
        'PIX charge generation is only available for receivable entries',
      );
    }

    // Validate status is PENDING or OVERDUE
    if (entry.status !== 'PENDING' && entry.status !== 'OVERDUE') {
      throw new BadRequestError(
        'PIX charge can only be generated for entries with PENDING or OVERDUE status',
      );
    }

    // Check if entry already has an active PIX charge
    if (entry.pixChargeId) {
      throw new BadRequestError(
        'This entry already has a PIX charge associated. Cancel the existing charge first.',
      );
    }

    // Calculate charge amount = remaining balance
    const chargeAmount =
      entry.remainingBalance > 0 ? entry.remainingBalance : entry.totalDue;

    if (chargeAmount <= 0) {
      throw new BadRequestError(
        'Entry balance must be greater than zero to generate a PIX charge',
      );
    }

    // Generate unique transaction ID (35 chars max for Efi)
    const txId = randomUUID().replace(/-/g, '').slice(0, 32);

    // Call PIX provider
    const chargeResult = await this.pixProvider.createCharge({
      txId,
      amount: chargeAmount,
      description: entry.description.slice(0, 140),
      expirationSeconds: request.expirationSeconds || 3600,
      payerCpfCnpj: request.payerCpfCnpj,
      payerName: request.payerName || entry.customerName || undefined,
    });

    // Persist PixCharge
    const pixCharge = PixCharge.create({
      tenantId,
      txId: chargeResult.txId,
      location: chargeResult.location,
      pixCopiaECola: chargeResult.pixCopiaECola,
      amount: chargeAmount,
      expiresAt: chargeResult.expiresAt,
      provider: this.pixProvider.providerName,
    });

    await this.pixChargesRepository.create(pixCharge);

    // Link PixCharge to FinanceEntry
    const updatedEntry = await this.financeEntriesRepository.update({
      id: new UniqueEntityID(entryId),
      tenantId,
      pixChargeId: pixCharge.pixChargeId.toString(),
    });

    if (!updatedEntry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    return {
      entry: financeEntryToDTO(updatedEntry),
      txId: chargeResult.txId,
      pixCopiaECola: chargeResult.pixCopiaECola,
      qrCodeUrl: chargeResult.location,
      expiresAt: chargeResult.expiresAt,
      amount: chargeAmount,
    };
  }
}
