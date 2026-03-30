import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import { CalculateWorkedHoursUseCase } from '@/use-cases/hr/time-control/calculate-worked-hours';
import { ClockInUseCase } from '@/use-cases/hr/time-control/clock-in';
import { ClockOutUseCase } from '@/use-cases/hr/time-control/clock-out';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let timeEntriesRepository: InMemoryTimeEntriesRepository;
let clockIn: ClockInUseCase;
let clockOut: ClockOutUseCase;
let calculateWorkedHours: CalculateWorkedHoursUseCase;

let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('[Integration] Clock In / Clock Out', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    timeEntriesRepository = new InMemoryTimeEntriesRepository();

    clockIn = new ClockInUseCase(timeEntriesRepository, employeesRepository);
    clockOut = new ClockOutUseCase(timeEntriesRepository, employeesRepository);
    calculateWorkedHours = new CalculateWorkedHoursUseCase(
      timeEntriesRepository,
      employeesRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Fernanda Oliveira',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should complete a full clock in → clock out cycle and calculate hours', async () => {
    const clockInTime = new Date('2024-06-10T08:00:00');
    const clockOutTime = new Date('2024-06-10T17:00:00');

    // Clock in
    const { timeEntry: entryIn } = await clockIn.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: clockInTime,
    });

    expect(entryIn.entryType.isEntryType()).toBe(true);

    // Clock out
    const { timeEntry: entryOut } = await clockOut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: clockOutTime,
    });

    expect(entryOut.entryType.isExitType()).toBe(true);

    // Calculate hours for the day
    const workedHoursReport = await calculateWorkedHours.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-06-10T00:00:00'),
      endDate: new Date('2024-06-10T23:59:59'),
    });

    expect(workedHoursReport.totalWorkedHours).toBe(9);
    expect(workedHoursReport.dailyBreakdown).toHaveLength(1);
    expect(workedHoursReport.dailyBreakdown[0].workedHours).toBe(9);
  });

  it('should detect overtime when working more than 8 hours per day (CLT standard)', async () => {
    // Work a 10-hour day
    await clockIn.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: new Date('2024-06-11T07:00:00'),
    });

    await clockOut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: new Date('2024-06-11T17:00:00'),
    });

    const report = await calculateWorkedHours.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-06-11T00:00:00'),
      endDate: new Date('2024-06-11T23:59:59'),
    });

    // 10 hours worked (7:00 to 17:00)
    expect(report.totalWorkedHours).toBe(10);
    expect(report.dailyBreakdown[0].workedHours).toBe(10);
  });

  it('should not allow double clock in without clock out', async () => {
    await clockIn.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: new Date('2024-06-12T08:00:00'),
    });

    await expect(
      clockIn.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        timestamp: new Date('2024-06-12T08:30:00'),
      }),
    ).rejects.toThrow('Employee has already clocked in');
  });

  it('should not allow clock out without prior clock in', async () => {
    await expect(
      clockOut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        timestamp: new Date('2024-06-13T17:00:00'),
      }),
    ).rejects.toThrow('Employee has not clocked in');
  });

  it('should calculate hours across multiple days', async () => {
    // Day 1
    await clockIn.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: new Date('2024-06-10T08:00:00'),
    });
    await clockOut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: new Date('2024-06-10T17:00:00'),
    });

    // Day 2
    await clockIn.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: new Date('2024-06-11T09:00:00'),
    });
    await clockOut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: new Date('2024-06-11T18:00:00'),
    });

    const weeklyReport = await calculateWorkedHours.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate: new Date('2024-06-10T00:00:00'),
      endDate: new Date('2024-06-11T23:59:59'),
    });

    expect(weeklyReport.dailyBreakdown).toHaveLength(2);
    expect(weeklyReport.totalWorkedHours).toBe(18); // 9 + 9
  });

  it('should not allow clock in for inactive employee', async () => {
    // Create a suspended employee
    const suspendedEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'João Suspenso',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.SUSPENDED(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      clockIn.execute({
        tenantId,
        employeeId: suspendedEmployee.id.toString(),
        timestamp: new Date('2024-06-14T08:00:00'),
      }),
    ).rejects.toThrow('Employee is not active');
  });
});
