import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

export interface GetTimeBankRequest {
  tenantId: string;
  employeeId: string;
  year?: number;
}

export interface GetTimeBankResponse {
  timeBank: TimeBank;
}

export class GetTimeBankUseCase {
  constructor(
    private timeBankRepository: TimeBankRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: GetTimeBankRequest): Promise<GetTimeBankResponse> {
    const { tenantId, employeeId, year = new Date().getFullYear() } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    let timeBank = await this.timeBankRepository.findByEmployeeAndYear(
      new UniqueEntityID(employeeId),
      year,
      tenantId,
    );

    // Create time bank if it doesn't exist
    if (!timeBank) {
      timeBank = await this.timeBankRepository.create({
        tenantId,
        employeeId: new UniqueEntityID(employeeId),
        balance: 0,
        year,
      });
    }

    return {
      timeBank,
    };
  }
}
