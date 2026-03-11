import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { ErrorCodes } from '@/@errors/error-codes';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

const MAX_OPTIMISTIC_LOCK_RETRIES = 3;

export interface AdjustTimeBankRequest {
  tenantId: string;
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
    const {
      tenantId,
      employeeId,
      newBalance,
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

    for (let attempt = 0; attempt < MAX_OPTIMISTIC_LOCK_RETRIES; attempt++) {
      const timeBank = await this.timeBankRepository.findByEmployeeAndYear(
        new UniqueEntityID(employeeId),
        year,
        tenantId,
      );

      if (timeBank) {
        const expectedVersion = timeBank.version;
        timeBank.adjust(newBalance);

        const saved = await this.timeBankRepository.optimisticSave(
          timeBank,
          expectedVersion,
        );

        if (saved) {
          return { timeBank };
        }

        // Version conflict — retry with fresh data
        continue;
      } else {
        const createdTimeBank = await this.timeBankRepository.create({
          tenantId,
          employeeId: new UniqueEntityID(employeeId),
          balance: newBalance,
          year,
        });

        return { timeBank: createdTimeBank };
      }
    }

    throw new ConflictError(
      'Time bank was modified by another request. Please retry.',
      ErrorCodes.OPTIMISTIC_LOCK_CONFLICT,
    );
  }
}
