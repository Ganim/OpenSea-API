import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export interface ClockInRequest {
  tenantId: string;
  employeeId: string;
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
}

export interface ClockInResponse {
  timeEntry: TimeEntry;
}

export class ClockInUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: ClockInRequest): Promise<ClockInResponse> {
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
      throw new Error('Employee not found');
    }

    // Verify employee is active
    if (!employee.status.isActive()) {
      throw new Error('Employee is not active');
    }

    // Check last entry to avoid duplicate clock in
    const lastEntry = await this.timeEntriesRepository.findLastEntryByEmployee(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (lastEntry && lastEntry.entryType.isEntryType()) {
      throw new Error(
        'Employee has already clocked in. Please clock out first',
      );
    }

    // Create clock in entry
    const timeEntry = await this.timeEntriesRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      entryType: TimeEntryType.CLOCK_IN(),
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
