import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface ApprovePayrollRequest {
  tenantId: string;
  payrollId: string;
  approvedBy: string;
}

export interface ApprovePayrollResponse {
  payroll: Payroll;
}

export class ApprovePayrollUseCase {
  constructor(private payrollsRepository: PayrollsRepository) {}

  async execute(
    request: ApprovePayrollRequest,
  ): Promise<ApprovePayrollResponse> {
    const { tenantId, payrollId, approvedBy } = request;

    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
      tenantId,
    );

    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    // Check if payroll can be approved
    if (!payroll.status.isCalculated()) {
      throw new Error('Apenas folhas calculadas podem ser aprovadas');
    }

    // Approve the payroll
    payroll.approve(new UniqueEntityID(approvedBy));

    // Save
    await this.payrollsRepository.save(payroll);

    return {
      payroll,
    };
  }
}
