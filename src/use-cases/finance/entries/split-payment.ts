import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import {
  type FinanceEntryPaymentDTO,
  financeEntryPaymentToDTO,
} from '@/mappers/finance/finance-entry-payment/finance-entry-payment-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface SplitPaymentAllocation {
  entryId: string;
  amount: number;
}

interface SplitPaymentUseCaseRequest {
  tenantId: string;
  paymentAmount: number;
  paymentDate: Date;
  bankAccountId?: string;
  paymentMethod?: string;
  notes?: string;
  createdBy?: string;
  allocations: SplitPaymentAllocation[];
}

interface SplitPaymentUseCaseResponse {
  payments: FinanceEntryPaymentDTO[];
  fullyPaidEntryIds: string[];
  partialEntryIds: string[];
}

const PAYABLE_STATUSES = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] as const;

export class SplitPaymentUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    request: SplitPaymentUseCaseRequest,
  ): Promise<SplitPaymentUseCaseResponse> {
    const {
      tenantId,
      paymentAmount,
      paymentDate,
      bankAccountId,
      paymentMethod,
      notes,
      createdBy,
      allocations,
    } = request;

    if (allocations.length === 0) {
      throw new BadRequestError('At least one allocation is required');
    }

    // Validate sum of allocations equals paymentAmount
    const allocationsSum = allocations.reduce(
      (sum, allocation) => sum + allocation.amount,
      0,
    );

    // Use rounding to avoid floating point issues
    if (Math.round(allocationsSum * 100) !== Math.round(paymentAmount * 100)) {
      throw new BadRequestError(
        'Sum of allocations must equal the total payment amount',
      );
    }

    // Validate each allocation amount is positive
    for (const allocation of allocations) {
      if (allocation.amount <= 0) {
        throw new BadRequestError(
          `Allocation amount must be positive for entry ${allocation.entryId}`,
        );
      }
    }

    // Pre-validate all entries exist and are in a payable status
    for (const allocation of allocations) {
      const entry = await this.financeEntriesRepository.findById(
        new UniqueEntityID(allocation.entryId),
        tenantId,
      );

      if (!entry) {
        throw new ResourceNotFoundError(
          `Finance entry ${allocation.entryId} not found`,
        );
      }

      if (
        !PAYABLE_STATUSES.includes(
          entry.status as (typeof PAYABLE_STATUSES)[number],
        )
      ) {
        throw new BadRequestError(
          `Entry ${entry.code} has status ${entry.status} and cannot receive payments`,
        );
      }

      const existingPaymentsSum =
        await this.financeEntryPaymentsRepository.sumByEntryId(
          new UniqueEntityID(allocation.entryId),
        );

      const remainingBalance = entry.totalDue - existingPaymentsSum;

      if (allocation.amount > remainingBalance + 0.01) {
        throw new BadRequestError(
          `Alocação excede o saldo restante do lançamento ${entry.code} (alocação: ${allocation.amount}, saldo: ${remainingBalance})`,
        );
      }
    }

    // Execute all payments atomically
    const createdPayments: FinanceEntryPaymentDTO[] = [];
    const fullyPaidEntryIds: string[] = [];
    const partialEntryIds: string[] = [];

    await this.transactionManager.run(async (tx: TransactionClient) => {
      for (const allocation of allocations) {
        // Acquire row-level lock to prevent concurrent payment races
        const entry = await this.financeEntriesRepository.findByIdForUpdate(
          new UniqueEntityID(allocation.entryId),
          tenantId,
          tx,
        );

        if (!entry) {
          throw new ResourceNotFoundError(
            `Finance entry ${allocation.entryId} not found`,
          );
        }

        const existingPaymentsSum =
          await this.financeEntryPaymentsRepository.sumByEntryId(
            new UniqueEntityID(allocation.entryId),
            tx,
          );

        const newTotalPaid = existingPaymentsSum + allocation.amount;

        const payment = await this.financeEntryPaymentsRepository.create(
          {
            entryId: allocation.entryId,
            amount: allocation.amount,
            paidAt: paymentDate,
            bankAccountId,
            method: paymentMethod,
            notes,
            createdBy,
          },
          tx,
        );

        const isFullyPaid =
          Math.round(newTotalPaid * 100) >= Math.round(entry.totalDue * 100);

        if (isFullyPaid) {
          const fullyPaidStatus =
            entry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';

          await this.financeEntriesRepository.update(
            {
              id: new UniqueEntityID(allocation.entryId),
              tenantId,
              status: fullyPaidStatus,
              actualAmount: newTotalPaid,
              paymentDate,
            },
            tx,
          );

          fullyPaidEntryIds.push(allocation.entryId);
        } else {
          await this.financeEntriesRepository.update(
            {
              id: new UniqueEntityID(allocation.entryId),
              tenantId,
              status: 'PARTIALLY_PAID',
              actualAmount: newTotalPaid,
            },
            tx,
          );

          partialEntryIds.push(allocation.entryId);
        }

        createdPayments.push(financeEntryPaymentToDTO(payment));
      }
    });

    // Audit log (non-blocking)
    queueAuditLog({
      userId: createdBy,
      action: 'FINANCE_SPLIT_PAYMENT',
      entity: 'FINANCE_ENTRY',
      entityId: allocations[0].entryId,
      module: 'FINANCE',
      description: `Split payment of ${paymentAmount} across ${allocations.length} entries`,
      newData: {
        paymentAmount,
        paymentDate: paymentDate.toISOString(),
        bankAccountId,
        paymentMethod,
        allocations,
        fullyPaidEntryIds,
        partialEntryIds,
      },
    }).catch(() => {});

    return {
      payments: createdPayments,
      fullyPaidEntryIds,
      partialEntryIds,
    };
  }
}
