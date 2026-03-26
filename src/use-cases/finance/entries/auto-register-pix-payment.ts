import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface AutoRegisterPixPaymentRequest {
  txId: string;
  amount: number;
  paidAt: Date;
  payerName?: string;
  endToEndId?: string;
}

interface AutoRegisterPixPaymentResponse {
  registered: boolean;
  entry?: FinanceEntryDTO;
}

/**
 * Automatically registers a PIX payment when a webhook notification
 * arrives for a PixCharge linked to a FinanceEntry.
 *
 * Called by the ReceivePixWebhookUseCase after the PixCharge is updated.
 */
export class AutoRegisterPixPaymentUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: AutoRegisterPixPaymentRequest,
  ): Promise<AutoRegisterPixPaymentResponse> {
    const { txId, amount, paidAt } = request;

    // Find finance entry linked to this txId via pixChargeId
    // We need to search by pixCharge's txId — find the entry that has a pixCharge with this txId
    const entries = await this.findEntryByPixChargeTxId(txId);

    if (!entries) {
      // No finance entry linked to this PIX charge — it may be a POS charge
      return { registered: false };
    }

    const entry = entries;

    // Only process if entry is in a payable state
    if (
      entry.status !== 'PENDING' &&
      entry.status !== 'OVERDUE' &&
      entry.status !== 'PARTIALLY_PAID'
    ) {
      return { registered: false };
    }

    const executePayment = async (tx?: TransactionClient) => {
      // Create payment record
      await this.financeEntryPaymentsRepository.create(
        {
          entryId: entry.id.toString(),
          amount,
          paidAt,
          method: 'PIX',
          reference: request.endToEndId || `PIX-${txId}`,
          notes: request.payerName
            ? `Pagamento PIX recebido de ${request.payerName}`
            : `Pagamento PIX recebido (txId: ${txId})`,
        },
        tx,
      );

      // Calculate new total
      const existingPaymentsSum =
        await this.financeEntryPaymentsRepository.sumByEntryId(
          new UniqueEntityID(entry.id.toString()),
          tx,
        );

      const newTotal = existingPaymentsSum;
      const isFullyPaid = newTotal >= entry.totalDue;

      // Update entry status
      const newStatus = isFullyPaid ? 'RECEIVED' : 'PARTIALLY_PAID';
      const updatedEntry = await this.financeEntriesRepository.update(
        {
          id: entry.id,
          tenantId: entry.tenantId.toString(),
          status: newStatus,
          actualAmount: newTotal,
          paymentDate: isFullyPaid ? paidAt : undefined,
        },
        tx,
      );

      return updatedEntry;
    };

    const updatedEntry = this.transactionManager
      ? await this.transactionManager.run((tx) => executePayment(tx))
      : await executePayment();

    // Fire-and-forget audit log
    queueAuditLog({
      action: 'FINANCE_PIX_WEBHOOK_PAYMENT',
      entity: 'FINANCE_ENTRY',
      entityId: entry.id.toString(),
      module: 'FINANCE',
      description: `Auto-registered PIX payment of ${amount} for entry ${entry.code} (txId: ${txId})`,
      newData: {
        txId,
        amount,
        paidAt: paidAt.toISOString(),
        payerName: request.payerName,
      },
    }).catch(() => {});

    return {
      registered: true,
      entry: updatedEntry ? financeEntryToDTO(updatedEntry) : undefined,
    };
  }

  /**
   * Find a FinanceEntry that has a PixCharge with the given txId.
   * Uses a direct Prisma query via the repository's findMany with metadata.
   */
  private async findEntryByPixChargeTxId(txId: string) {
    // We search for entries that have a pixCharge relation with matching txId.
    // Since our repository doesn't have this method, we use a simple approach:
    // Import prisma directly for this specific cross-domain query.
    const { prisma } = await import('@/lib/prisma');

    const entryRecord = await prisma.financeEntry.findFirst({
      where: {
        pixCharge: {
          txId,
        },
        deletedAt: null,
      },
    });

    if (!entryRecord) {
      return null;
    }

    // Map to domain via the mapper
    const { financeEntryPrismaToDomain } = await import(
      '@/mappers/finance/finance-entry/finance-entry-prisma-to-domain'
    );

    return financeEntryPrismaToDomain(entryRecord);
  }
}
