import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { TransferEmployeeUseCase } from './transfer-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: TransferEmployeeUseCase;

describe('Transfer Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new TransferEmployeeUseCase(employeesRepository);
  });

  it('should transfer employee to new department', async () => {
    const createdEmployee = await employeesRepository.create({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      departmentId: new UniqueEntityID('old-dept-id'),
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
      newDepartmentId: 'new-dept-id',
      reason: 'Promoção',
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.departmentId?.toString()).toBe('new-dept-id');
    expect(result.employee.metadata).toHaveProperty('transferHistory');
  });

  it('should transfer employee to new position with salary change', async () => {
    const createdEmployee = await employeesRepository.create({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      positionId: new UniqueEntityID('old-pos-id'),
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
      newPositionId: 'new-pos-id',
      newBaseSalary: 4000,
      reason: 'Promoção para Gerente',
    });

    expect(result.employee.positionId?.toString()).toBe('new-pos-id');
    expect(result.employee.baseSalary).toBe(4000);
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        employeeId: 'non-existent-id',
        newDepartmentId: 'new-dept-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error when employee is terminated', async () => {
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
    });

    await expect(
      sut.execute({
        employeeId: createdEmployee.id.toString(),
        newDepartmentId: 'new-dept-id',
      }),
    ).rejects.toThrow('Cannot transfer a terminated employee');
  });

  it('should transfer employee to new supervisor', async () => {
    const createdEmployee = await employeesRepository.create({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      supervisorId: new UniqueEntityID('old-supervisor-id'),
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
      newSupervisorId: 'new-supervisor-id',
      reason: 'Reestruturação de equipe',
    });

    expect(result.employee.supervisorId?.toString()).toBe('new-supervisor-id');
  });

  it('should remove department from employee', async () => {
    const createdEmployee = await employeesRepository.create({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      departmentId: new UniqueEntityID('old-dept-id'),
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
      newDepartmentId: null,
      reason: 'Funcionário sem departamento temporariamente',
    });

    expect(result.employee.departmentId).toBeUndefined();
  });
});
