import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';

describe('InMemoryEmployeesRepository', () => {
  let repository: InMemoryEmployeesRepository;
  const tenantId = new UniqueEntityID().toString();

  beforeEach(() => {
    repository = new InMemoryEmployeesRepository();
  });

  it('should create an employee', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const employee = await repository.create(employeeData);

    expect(employee).toBeInstanceOf(Employee);
    expect(employee.registrationNumber).toBe('EMP001');
    expect(employee.fullName).toBe('João Silva');
    expect(employee.cpf.equals(cpf)).toBe(true);
    expect(employee.status.value).toBe('ACTIVE');
  });

  it('should find employee by id', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const createdEmployee = await repository.create(employeeData);
    const foundEmployee = await repository.findById(
      createdEmployee.id,
      tenantId,
    );

    expect(foundEmployee).toBeDefined();
    expect(foundEmployee?.id.equals(createdEmployee.id)).toBe(true);
  });

  it('should find employee by registration number', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    await repository.create(employeeData);
    const foundEmployee = await repository.findByRegistrationNumber(
      'EMP001',
      tenantId,
    );

    expect(foundEmployee).toBeDefined();
    expect(foundEmployee?.registrationNumber).toBe('EMP001');
  });

  it('should find employee by CPF', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    await repository.create(employeeData);
    const foundEmployee = await repository.findByCpf(cpf, tenantId);

    expect(foundEmployee).toBeDefined();
    expect(foundEmployee?.cpf.equals(cpf)).toBe(true);
  });

  it('should return null when employee not found', async () => {
    const nonExistentId = new UniqueEntityID();
    const result = await repository.findById(nonExistentId, tenantId);

    expect(result).toBeNull();
  });

  it('should find many employees', async () => {
    const cpf1 = CPF.create('52998224725');
    const cpf2 = CPF.create('12345678909');

    await repository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: cpf1,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    await repository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: cpf2,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    const employees = await repository.findMany(tenantId);

    expect(employees).toHaveLength(2);
    expect(employees[0].fullName).toBe('João Silva');
    expect(employees[1].fullName).toBe('Maria Santos');
  });

  it('should find active employees', async () => {
    const cpf1 = CPF.create('52998224725');
    const cpf2 = CPF.create('12345678909');

    await repository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: cpf1,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    await repository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: cpf2,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 3500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });

    const activeEmployees = await repository.findManyActive(tenantId);

    expect(activeEmployees).toHaveLength(1);
    expect(activeEmployees[0].fullName).toBe('João Silva');
  });

  it('should update employee', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const createdEmployee = await repository.create(employeeData);

    const updatedEmployee = await repository.update({
      id: createdEmployee.id,
      fullName: 'João Silva Santos',
      baseSalary: 3500,
    });

    expect(updatedEmployee).toBeDefined();
    expect(updatedEmployee?.fullName).toBe('João Silva Santos');
    expect(updatedEmployee?.baseSalary).toBe(3500);
  });

  it('should delete employee (soft delete)', async () => {
    const cpf = CPF.create('52998224725');
    const employeeData = {
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf,
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    };

    const createdEmployee = await repository.create(employeeData);

    await repository.delete(createdEmployee.id);

    const foundEmployee = await repository.findById(
      createdEmployee.id,
      tenantId,
    );
    expect(foundEmployee).toBeNull();

    // Employee should not appear in findMany
    const employees = await repository.findMany(tenantId);
    expect(employees).toHaveLength(0);
  });
});
