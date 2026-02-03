import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
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
      throw new Error('Apenas folhas aprovadas podem ser pagas');
    }

    // Mark as paid
    payroll.markAsPaid(new UniqueEntityID(paidBy));

    // Update related records
    await this.markRelatedItemsAsPaid(payroll.id, tenantId);

    // Save
    await this.payrollsRepository.save(payroll);

    return {
      payroll,
    };
  }

  private async markRelatedItemsAsPaid(
    payrollId: UniqueEntityID,
    tenantId: string,
  ): Promise<void> {
    // Get all payroll items
    const items =
      await this.payrollItemsRepository.findManyByPayroll(payrollId);

    // Mark bonuses as paid
    for (const item of items) {
      if (item.referenceType === 'bonus' && item.referenceId) {
        const bonus = await this.bonusesRepository.findById(
          new UniqueEntityID(item.referenceId),
          tenantId,
        );
        if (bonus) {
          bonus.markAsPaid();
          await this.bonusesRepository.save(bonus);
        }
      }

      // Mark deductions as applied (increment paid installments)
      if (item.referenceType === 'deduction' && item.referenceId) {
        const deduction = await this.deductionsRepository.findById(
          new UniqueEntityID(item.referenceId),
          tenantId,
        );
        if (deduction && deduction.isRecurring) {
          deduction.markAsApplied(payrollId);
          await this.deductionsRepository.save(deduction);
        }
      }
    }
  }
}
