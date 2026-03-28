import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryDependantsRepository } from '@/repositories/hr/in-memory/in-memory-dependants-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDependantUseCase } from './create-dependant';

let dependantsRepository: InMemoryDependantsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CreateDependantUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Create Dependant Use Case', () => {
  beforeEach(async () => {
    dependantsRepository = new InMemoryDependantsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreateDependantUseCase(dependantsRepository, employeesRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Maria Silva',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create a dependant successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'João Silva',
      birthDate: new Date('2015-06-15'),
      relationship: 'CHILD',
    });

    expect(result.dependant).toBeDefined();
    expect(result.dependant.name).toBe('João Silva');
    expect(result.dependant.relationship).toBe('CHILD');
    expect(result.dependant.employeeId.equals(testEmployee.id)).toBe(true);
  });

  it('should create a dependant with CPF', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Ana Silva',
      cpf: '123.456.789-09',
      birthDate: new Date('2010-03-20'),
      relationship: 'CHILD',
    });

    expect(result.dependant.cpf).toBe('123.456.789-09');
  });

  it('should create a dependant with IRRF flag', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Pedro Silva',
      birthDate: new Date('2018-09-01'),
      relationship: 'CHILD',
      isIrrfDependant: true,
    });

    expect(result.dependant.isIrrfDependant).toBe(true);
  });

  it('should create a dependant with salario familia flag', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Lucas Silva',
      birthDate: new Date('2020-01-01'),
      relationship: 'CHILD',
      isSalarioFamilia: true,
    });

    expect(result.dependant.isSalarioFamilia).toBe(true);
  });

  it('should create a dependant with disability flag', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Beatriz Silva',
      birthDate: new Date('2012-12-25'),
      relationship: 'CHILD',
      hasDisability: true,
    });

    expect(result.dependant.hasDisability).toBe(true);
  });

  it('should default boolean flags to false', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Carlos Silva',
      birthDate: new Date('1985-07-10'),
      relationship: 'SPOUSE',
    });

    expect(result.dependant.isIrrfDependant).toBe(false);
    expect(result.dependant.isSalarioFamilia).toBe(false);
    expect(result.dependant.hasDisability).toBe(false);
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        name: 'Dependant Name',
        birthDate: new Date('2000-01-01'),
        relationship: 'SPOUSE',
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should throw error when name is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: '',
        birthDate: new Date('2000-01-01'),
        relationship: 'CHILD',
      }),
    ).rejects.toThrow('O nome do dependente é obrigatório');
  });

  it('should throw error when name is whitespace only', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: '   ',
        birthDate: new Date('2000-01-01'),
        relationship: 'CHILD',
      }),
    ).rejects.toThrow('O nome do dependente é obrigatório');
  });

  it('should trim the dependant name', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: '  João Silva  ',
      birthDate: new Date('2015-06-15'),
      relationship: 'CHILD',
    });

    expect(result.dependant.name).toBe('João Silva');
  });

  it('should persist the dependant in the repository', async () => {
    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Dependant Persisted',
      birthDate: new Date('2010-01-01'),
      relationship: 'CHILD',
    });

    expect(dependantsRepository.items).toHaveLength(1);
    expect(dependantsRepository.items[0].name).toBe('Dependant Persisted');
  });

  it('should create multiple dependants for the same employee', async () => {
    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'First Child',
      birthDate: new Date('2015-01-01'),
      relationship: 'CHILD',
    });

    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Spouse',
      birthDate: new Date('1990-05-15'),
      relationship: 'SPOUSE',
    });

    expect(dependantsRepository.items).toHaveLength(2);
  });
});
