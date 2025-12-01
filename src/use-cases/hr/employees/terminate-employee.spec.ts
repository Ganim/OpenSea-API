import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { TerminateEmployeeUseCase } from './terminate-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: TerminateEmployeeUseCase;

describe('Terminate Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new TerminateEmployeeUseCase(employeesRepository);
  });

  it('should terminate an employee successfully', async () => {
    const createdEmployee = await employeesRepository.create({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const terminationDate = new Date('2024-12-01');
    const result = await sut.execute({
      employeeId: createdEmployee.id.toString(),
      terminationDate,
      reason: 'Pedido de demissão',
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.status.value).toBe('TERMINATED');
    expect(result.employee.terminationDate).toEqual(terminationDate);
    expect(result.employee.metadata).toHaveProperty(
      'terminationReason',
      'Pedido de demissão',
    );
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        employeeId: 'non-existent-id',
        terminationDate: new Date(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error when employee is already terminated', async () => {
    const createdEmployee = await employeesRepository.create({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
      terminationDate: new Date('2024-06-01'),
    });

    await expect(
      sut.execute({
        employeeId: createdEmployee.id.toString(),
        terminationDate: new Date(),
      }),
    ).rejects.toThrow('Employee is already terminated');
  });

  it('should terminate employee without reason', async () => {
    const createdEmployee = await employeesRepository.create({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const result = await sut.execute({
      employeeId: createdEmployee.id.toString(),
      terminationDate: new Date('2024-12-01'),
    });

    expect(result.employee.status.value).toBe('TERMINATED');
  });
});
