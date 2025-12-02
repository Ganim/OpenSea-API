import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface GetPayrollRequest {
  payrollId: string;
}

export interface GetPayrollResponse {
  payroll: Payroll;
}

export class GetPayrollUseCase {
  constructor(private payrollsRepository: PayrollsRepository) {}

  async execute(request: GetPayrollRequest): Promise<GetPayrollResponse> {
    const { payrollId } = request;

    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
    );

    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    return {
      payroll,
    };
  }
}
