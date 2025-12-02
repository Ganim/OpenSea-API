import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

export interface AdjustTimeBankRequest {
  employeeId: string;
  newBalance: number;
  year?: number;
}

export interface AdjustTimeBankResponse {
  timeBank: TimeBank;
}

export class AdjustTimeBankUseCase {
  constructor(
    private timeBankRepository: TimeBankRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: AdjustTimeBankRequest,
  ): Promise<AdjustTimeBankResponse> {
    const { employeeId, newBalance, year = new Date().getFullYear() } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    let timeBank = await this.timeBankRepository.findByEmployeeAndYear(
      new UniqueEntityID(employeeId),
      year,
    );

    if (timeBank) {
      timeBank.adjust(newBalance);
      await this.timeBankRepository.save(timeBank);
    } else {
      timeBank = await this.timeBankRepository.create({
        employeeId: new UniqueEntityID(employeeId),
        balance: newBalance,
        year,
      });
    }

    return {
      timeBank,
    };
  }
}
