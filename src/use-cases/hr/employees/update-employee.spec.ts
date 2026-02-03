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
import { UpdateEmployeeUseCase } from './update-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: UpdateEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Update Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new UpdateEmployeeUseCase(employeesRepository);
  });

  it('should update employee successfully', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
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
      tenantId,
      employeeId: createdEmployee.id.toString(),
      fullName: 'João Silva Santos',
      baseSalary: 3500,
      email: 'joao.santos@email.com',
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.fullName).toBe('João Silva Santos');
    expect(result.employee.baseSalary).toBe(3500);
    expect(result.employee.email).toBe('joao.santos@email.com');
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: 'non-existent-id',
        fullName: 'João Silva Santos',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not update to CPF that already exists', async () => {
    await employeesRepository.create({
      tenantId,
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

    const secondEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: CPF.create('12345678909'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 2500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: secondEmployee.id.toString(),
        cpf: '529.982.247-25', // Same CPF as first employee
      }),
    ).rejects.toThrow('Employee with this CPF already exists');
  });

  it('should not update to registration number that already exists', async () => {
    await employeesRepository.create({
      tenantId,
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

    const secondEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: CPF.create('12345678909'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 2500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: secondEmployee.id.toString(),
        registrationNumber: 'EMP001', // Same registration number as first employee
      }),
    ).rejects.toThrow('Employee with this registration number already exists');
  });

  it('should update contract type', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
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
      tenantId,
      employeeId: createdEmployee.id.toString(),
      contractType: 'PJ',
    });

    expect(result.employee.contractType.value).toBe('PJ');
  });

  it('should update work regime', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
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
      tenantId,
      employeeId: createdEmployee.id.toString(),
      workRegime: 'PART_TIME',
      weeklyHours: 22,
    });

    expect(result.employee.workRegime.value).toBe('PART_TIME');
    expect(result.employee.weeklyHours).toBe(22);
  });
});
