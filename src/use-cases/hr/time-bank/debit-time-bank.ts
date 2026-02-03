import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

export interface DebitTimeBankRequest {
  tenantId: string;
  employeeId: string;
  hours: number;
  year?: number;
}

export interface DebitTimeBankResponse {
  timeBank: TimeBank;
}

export class DebitTimeBankUseCase {
  constructor(
    private timeBankRepository: TimeBankRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: DebitTimeBankRequest): Promise<DebitTimeBankResponse> {
    const {
      tenantId,
      employeeId,
      hours,
      year = new Date().getFullYear(),
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Validate hours
    if (hours <= 0) {
      throw new Error('Hours must be greater than 0');
    }

    const timeBank = await this.timeBankRepository.findByEmployeeAndYear(
      new UniqueEntityID(employeeId),
      year,
      tenantId,
    );

    if (!timeBank) {
      throw new Error('Time bank not found for this employee and year');
    }

    timeBank.debit(hours);
    await this.timeBankRepository.save(timeBank);

    return {
      timeBank,
    };
  }
}
