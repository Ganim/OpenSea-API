import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
import { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface CancelPayrollRequest {
  payrollId: string;
}

export interface CancelPayrollResponse {
  payroll: Payroll;
}

export class CancelPayrollUseCase {
  constructor(
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
  ) {}

  async execute(request: CancelPayrollRequest): Promise<CancelPayrollResponse> {
    const { payrollId } = request;

    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
    );

    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    // Check if payroll can be cancelled
    if (payroll.status.isPaid()) {
      throw new Error('Folhas já pagas não podem ser canceladas');
    }

    // Cancel the payroll
    payroll.cancel();

    // Delete all related items
    await this.payrollItemsRepository.deleteByPayroll(payroll.id);

    // Save
    await this.payrollsRepository.save(payroll);

    return {
      payroll,
    };
  }
}
