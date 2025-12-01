import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

export interface CreditTimeBankRequest {
  employeeId: string;
  hours: number;
  year?: number;
}

export interface CreditTimeBankResponse {
  timeBank: TimeBank;
}

export class CreditTimeBankUseCase {
  constructor(
    private timeBankRepository: TimeBankRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CreditTimeBankRequest,
  ): Promise<CreditTimeBankResponse> {
    const { employeeId, hours, year = new Date().getFullYear() } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Validate hours
    if (hours <= 0) {
      throw new Error('Hours must be greater than 0');
    }

    let timeBank = await this.timeBankRepository.findByEmployeeAndYear(
      new UniqueEntityID(employeeId),
      year,
    );

    if (timeBank) {
      timeBank.credit(hours);
      await this.timeBankRepository.save(timeBank);
    } else {
      timeBank = await this.timeBankRepository.create({
        employeeId: new UniqueEntityID(employeeId),
        balance: hours,
        year,
      });
    }

    return {
      timeBank,
    };
  }
}
