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
import { beforeEach, describe, expect, it } from 'vitest';
import { ClockInUseCase } from './clock-in';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ClockInUseCase;
let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('Clock In Use Case', () => {
  beforeEach(async () => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ClockInUseCase(timeEntriesRepository, employeesRepository);

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

  it('should clock in successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    expect(result.timeEntry).toBeDefined();
    expect(result.timeEntry.employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.timeEntry.entryType.value).toBe('CLOCK_IN');
    expect(result.timeEntry.timestamp).toBeDefined();
  });

  it('should clock in with geolocation data', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      latitude: -23.5505,
      longitude: -46.6333,
      ipAddress: '192.168.1.1',
      notes: 'Worked from office',
    });

    expect(result.timeEntry.latitude).toBe(-23.5505);
    expect(result.timeEntry.longitude).toBe(-46.6333);
    expect(result.timeEntry.ipAddress).toBe('192.168.1.1');
    expect(result.timeEntry.notes).toBe('Worked from office');
  });

  it('should clock in with custom timestamp', async () => {
    const customTimestamp = new Date('2024-01-15T08:00:00Z');
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      timestamp: customTimestamp,
    });

    expect(result.timeEntry.timestamp.getTime()).toBe(
      customTimestamp.getTime(),
    );
  });

  it('should not clock in if employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should not clock in if employee is not active', async () => {
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

  it('should not clock in if already clocked in', async () => {
    // First clock in
    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    // Try to clock in again
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
      }),
    ).rejects.toThrow(
      'Employee has already clocked in. Please clock out first',
    );
  });
});
