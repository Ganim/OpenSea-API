import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export interface ClockOutRequest {
  tenantId: string;
  employeeId: string;
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
}

export interface ClockOutResponse {
  timeEntry: TimeEntry;
}

export class ClockOutUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: ClockOutRequest): Promise<ClockOutResponse> {
    const {
      tenantId,
      employeeId,
      timestamp = new Date(),
      latitude,
      longitude,
      ipAddress,
      notes,
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Employee not found');
    }

    // Verify employee is active
    if (!employee.status.isActive()) {
      throw new BadRequestError('Employee is not active');
    }

    // Check last entry to ensure employee has clocked in
    const lastEntry = await this.timeEntriesRepository.findLastEntryByEmployee(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!lastEntry || lastEntry.entryType.isExitType()) {
      throw new BadRequestError(
        'Employee has not clocked in. Please clock in first',
      );
    }

    // Create clock out entry with sequential NSR (Portaria 671 requires a
    // unique NSR per punch, including clock-outs — previously skipped here).
    const timeEntry = await this.timeEntriesRepository.createWithSequentialNsr({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp,
      latitude,
      longitude,
      ipAddress,
      notes,
    });

    return {
      timeEntry,
    };
  }
}
