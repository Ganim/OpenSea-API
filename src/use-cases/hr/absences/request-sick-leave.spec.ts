import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequestSickLeaveUseCase } from './request-sick-leave';

let absencesRepository: InMemoryAbsencesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: RequestSickLeaveUseCase;
let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('Request Sick Leave Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new RequestSickLeaveUseCase(absencesRepository, employeesRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should request sick leave successfully', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // 3 days sick leave

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      documentUrl: 'https://example.com/atestado.pdf',
      reason: 'Gripe forte com febre alta',
    });

    expect(result.absence).toBeDefined();
    expect(result.absence.employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.absence.type.isSickLeave()).toBe(true);
    expect(result.absence.cid).toBe('J11');
    expect(result.absence.isPaid).toBe(true);
  });

  it('should mark as INSS responsibility if more than 15 days', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 19); // 20 days

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'M54',
      documentUrl: 'https://example.com/atestado.pdf',
      reason: 'Lombalgia severa com afastamento prolongado',
    });

    expect(result.absence.totalDays).toBe(20);
    expect(result.absence.isInssResponsibility).toBe(true);
  });

  it('should throw error if employee not found', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        startDate,
        endDate,
        cid: 'J11',
        reason: 'Gripe forte',
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should throw error if employee is not active', async () => {
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

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    await expect(
      sut.execute({
        tenantId,
        employeeId: inactiveEmployee.id.toString(),
        startDate,
        endDate,
        cid: 'J11',
        reason: 'Gripe forte com febre alta',
      }),
    ).rejects.toThrow('Funcionário não está ativo');
  });

  it('should throw error if CID code is not provided', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        startDate,
        endDate,
        reason: 'Gripe forte com febre alta',
      }),
    ).rejects.toThrow('Código CID é obrigatório para atestados médicos');
  });

  it('should calculate total days correctly', async () => {
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-05'); // 5 days

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      startDate,
      endDate,
      cid: 'J11',
      reason: 'Gripe forte com febre alta e tosse',
    });

    expect(result.absence.totalDays).toBe(5);
  });
});
