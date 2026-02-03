import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  TimeEntryType,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateWorkedHoursUseCase } from './calculate-worked-hours';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CalculateWorkedHoursUseCase;
let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('Calculate Worked Hours Use Case', () => {
  beforeEach(async () => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CalculateWorkedHoursUseCase(
      timeEntriesRepository,
      employeesRepository,
    );

    // Create test employee
    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date(),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should calculate worked hours for a simple day', async () => {
    // Clock in at 8:00, clock out at 17:00 = 9 hours
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date('2024-01-15T17:00:00Z'),
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
    });

    expect(result.dailyBreakdown).toHaveLength(1);
    expect(result.totalWorkedHours).toBe(9);
    expect(result.totalNetHours).toBe(9);
  });

  it('should calculate worked hours with breaks', async () => {
    // 8:00 - 12:00 = 4 hours (before break)
    // 12:00 - 13:00 = 1 hour break
    // 13:00 - 17:00 = 4 hours (after break)
    // Total worked: 8 hours, break: 1 hour, net: 7 hours
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.BREAK_START(),
      timestamp: new Date('2024-01-15T12:00:00Z'),
    });

    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.BREAK_END(),
      timestamp: new Date('2024-01-15T13:00:00Z'),
    });

    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date('2024-01-15T17:00:00Z'),
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
    });

    expect(result.dailyBreakdown).toHaveLength(1);
    expect(result.totalWorkedHours).toBe(9); // 8:00 - 17:00
    expect(result.totalBreakHours).toBe(1); // 12:00 - 13:00
    expect(result.totalNetHours).toBe(8); // 9 - 1
  });

  it('should calculate overtime hours', async () => {
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.OVERTIME_START(),
      timestamp: new Date('2024-01-15T18:00:00Z'),
    });

    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.OVERTIME_END(),
      timestamp: new Date('2024-01-15T20:00:00Z'),
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
    });

    expect(result.totalOvertimeHours).toBe(2);
  });

  it('should calculate worked hours for multiple days', async () => {
    // Day 1: 8:00 - 17:00 = 9 hours
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date('2024-01-15T17:00:00Z'),
    });

    // Day 2: 9:00 - 18:00 = 9 hours
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-16T09:00:00Z'),
    });
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date('2024-01-16T18:00:00Z'),
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-16T23:59:59Z'),
    });

    expect(result.dailyBreakdown).toHaveLength(2);
    expect(result.totalWorkedHours).toBe(18);
    expect(result.totalNetHours).toBe(18);
  });

  it('should throw error if employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        startDate: new Date('2024-01-15T00:00:00Z'),
        endDate: new Date('2024-01-15T23:59:59Z'),
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should return empty breakdown when no entries exist', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
    });

    expect(result.dailyBreakdown).toHaveLength(0);
    expect(result.totalWorkedHours).toBe(0);
    expect(result.totalNetHours).toBe(0);
  });
});
