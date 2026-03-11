import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { ErrorCodes } from '@/@errors/error-codes';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

const MAX_OPTIMISTIC_LOCK_RETRIES = 3;

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
      throw new ResourceNotFoundError('Employee not found');
    }

    // Validate hours
    if (hours <= 0) {
      throw new BadRequestError('Hours must be greater than 0');
    }

    for (let attempt = 0; attempt < MAX_OPTIMISTIC_LOCK_RETRIES; attempt++) {
      const timeBank = await this.timeBankRepository.findByEmployeeAndYear(
        new UniqueEntityID(employeeId),
        year,
        tenantId,
      );

      if (!timeBank) {
        throw new ResourceNotFoundError(
          'Time bank not found for this employee and year',
        );
      }

      const expectedVersion = timeBank.version;
      timeBank.debit(hours);

      const saved = await this.timeBankRepository.optimisticSave(
        timeBank,
        expectedVersion,
      );

      if (saved) {
        return { timeBank };
      }

      // Version conflict — retry with fresh data
    }

    throw new ConflictError(
      'Time bank was modified by another request. Please retry.',
      ErrorCodes.OPTIMISTIC_LOCK_CONFLICT,
    );
  }
}
