import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
    ContractType,
    CPF,
    EmployeeStatus,
    WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryOvertimeRepository } from '@/repositories/hr/in-memory/in-memory-overtime-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequestOvertimeUseCase } from './request-overtime';

let overtimeRepository: InMemoryOvertimeRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: RequestOvertimeUseCase;
let testEmployee: Employee;

describe('Request Overtime Use Case', () => {
  beforeEach(async () => {
    overtimeRepository = new InMemoryOvertimeRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new RequestOvertimeUseCase(overtimeRepository, employeesRepository);

    testEmployee = await employeesRepository.create({
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

  it('should request overtime successfully', async () => {
    const result = await sut.execute({
      employeeId: testEmployee.id.toString(),
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline approaching, need extra time to finish',
    });

    expect(result.overtime).toBeDefined();
    expect(result.overtime.employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.overtime.hours).toBe(2);
    expect(result.overtime.approved).toBe(false);
  });

  it('should throw error if employee not found', async () => {
    await expect(
      sut.execute({
        employeeId: new UniqueEntityID().toString(),
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Need to work overtime for project deadline',
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should throw error if employee is not active', async () => {
    const inactiveEmployee = await employeesRepository.create({
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
        employeeId: inactiveEmployee.id.toString(),
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Need to work overtime for project deadline',
      }),
    ).rejects.toThrow('Employee is not active');
  });

  it('should throw error for invalid hours (zero or negative)', async () => {
    await expect(
      sut.execute({
        employeeId: testEmployee.id.toString(),
        date: new Date('2024-01-15'),
        hours: 0,
        reason: 'Need to work overtime for project deadline',
      }),
    ).rejects.toThrow('Hours must be greater than 0');
  });

  it('should throw error for hours exceeding 12', async () => {
    await expect(
      sut.execute({
        employeeId: testEmployee.id.toString(),
        date: new Date('2024-01-15'),
        hours: 15,
        reason: 'Need to work overtime for project deadline',
      }),
    ).rejects.toThrow('Hours cannot exceed 12 hours per request');
  });

  it('should throw error for reason too short', async () => {
    await expect(
      sut.execute({
        employeeId: testEmployee.id.toString(),
        date: new Date('2024-01-15'),
        hours: 2,
        reason: 'Short',
      }),
    ).rejects.toThrow('Reason must be at least 10 characters');
  });
});
