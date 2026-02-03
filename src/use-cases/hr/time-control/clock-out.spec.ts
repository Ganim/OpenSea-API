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
import { ClockOutUseCase } from './clock-out';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ClockOutUseCase;
let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('Clock Out Use Case', () => {
  beforeEach(async () => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ClockOutUseCase(timeEntriesRepository, employeesRepository);

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

  it('should clock out successfully after clock in', async () => {
    // First clock in
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date(),
    });

    // Then clock out
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    expect(result.timeEntry).toBeDefined();
    expect(result.timeEntry.employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.timeEntry.entryType.value).toBe('CLOCK_OUT');
  });

  it('should clock out with geolocation data', async () => {
    // First clock in
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date(),
    });

    // Then clock out with geolocation
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      latitude: -23.5505,
      longitude: -46.6333,
      ipAddress: '192.168.1.1',
      notes: 'Left from office',
    });

    expect(result.timeEntry.latitude).toBe(-23.5505);
    expect(result.timeEntry.longitude).toBe(-46.6333);
    expect(result.timeEntry.ipAddress).toBe('192.168.1.1');
    expect(result.timeEntry.notes).toBe('Left from office');
  });

  it('should not clock out if employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should not clock out if employee is not active', async () => {
    // Create inactive employee
    const inactiveEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Inactive Employee',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date(),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: inactiveEmployee.id.toString(),
      }),
    ).rejects.toThrow('Employee is not active');
  });

  it('should not clock out if not clocked in', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
      }),
    ).rejects.toThrow('Employee has not clocked in. Please clock in first');
  });

  it('should not clock out if already clocked out', async () => {
    // Clock in
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    // Clock out
    await timeEntriesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date('2024-01-15T17:00:00Z'),
    });

    // Try to clock out again
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
      }),
    ).rejects.toThrow('Employee has not clocked in. Please clock in first');
  });
});
