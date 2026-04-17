import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';
import { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface ProcessPayrollPaymentRequest {
  tenantId: string;
  payrollId: string;
  paidBy: string;
}

export interface ProcessPayrollPaymentResponse {
  payroll: Payroll;
}

export class ProcessPayrollPaymentUseCase {
  constructor(
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private bonusesRepository: BonusesRepository,
    private deductionsRepository: DeductionsRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: ProcessPayrollPaymentRequest,
  ): Promise<ProcessPayrollPaymentResponse> {
    const { tenantId, payrollId, paidBy } = request;

    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
      tenantId,
    );

    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    // Check if payroll can be paid
    if (!payroll.status.isApproved()) {
      throw new BadRequestError('Apenas folhas aprovadas podem ser pagas');
    }

    // Mark as paid
    payroll.markAsPaid(new UniqueEntityID(paidBy));

    const processPayment = async (
      tx?: TransactionClient,
    ): Promise<ProcessPayrollPaymentResponse> => {
      // Update related records within the same transaction
      await this.markRelatedItemsAsPaid(payroll.id, tenantId, tx);

      // Save payroll within the same transaction
      await this.payrollsRepository.save(payroll, tx);

      return { payroll };
    };

    // Wrap all mutations in a transaction when available
    if (this.transactionManager) {
      return this.transactionManager.run((tx) => processPayment(tx));
    }

    // Fallback without transaction (in-memory tests)
    return processPayment();
  }

  private async markRelatedItemsAsPaid(
    payrollId: UniqueEntityID,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    // Get all payroll items
    const items = await this.payrollItemsRepository.findManyByPayroll(
      payrollId,
      tx,
    );

    // Mark bonuses as paid
    for (const item of items) {
      if (item.referenceType === 'bonus' && item.referenceId) {
        const bonus = await this.bonusesRepository.findById(
          new UniqueEntityID(item.referenceId),
          tenantId,
          tx,
        );
        if (bonus) {
          bonus.markAsPaid();
          await this.bonusesRepository.save(bonus, tx);
        }
      }

      // Mark deductions as applied (increment paid installments)
      if (item.referenceType === 'deduction' && item.referenceId) {
        const deduction = await this.deductionsRepository.findById(
          new UniqueEntityID(item.referenceId),
          tenantId,
          tx,
        );
        if (deduction && deduction.isRecurring) {
          deduction.markAsApplied(payrollId);
          await this.deductionsRepository.save(deduction, tx);
        }
      }
    }
  }
}
