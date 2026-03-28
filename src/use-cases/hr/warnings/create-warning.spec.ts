import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWarningUseCase } from './create-warning';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CreateWarningUseCase;
let testEmployee: Employee;
let testIssuer: Employee;
const tenantId = new UniqueEntityID().toString();

describe('Create Warning Use Case', () => {
  beforeEach(async () => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreateWarningUseCase(warningsRepository, employeesRepository);

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

    testIssuer = await employeesRepository.create({
      tenantId,
      registrationNumber: 'MGR001',
      fullName: 'Manager Employee',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2020-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create a verbal warning successfully', async () => {
    const { warning } = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: testIssuer.id.toString(),
      type: 'VERBAL',
      severity: 'LOW',
      reason: 'Atraso reiterado sem justificativa',
      incidentDate: new Date('2024-03-01'),
    });

    expect(warning).toBeDefined();
    expect(warning.type.isVerbal()).toBe(true);
    expect(warning.severity.isLow()).toBe(true);
    expect(warning.status.isActive()).toBe(true);
    expect(warning.employeeAcknowledged).toBe(false);
  });

  it('should create a written warning with description', async () => {
    const { warning } = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: testIssuer.id.toString(),
      type: 'WRITTEN',
      severity: 'MEDIUM',
      reason: 'Descumprimento de norma interna',
      description:
        'O colaborador foi flagrado utilizando celular em área restrita',
      incidentDate: new Date('2024-03-15'),
      witnessName: 'João Silva',
    });

    expect(warning.type.isWritten()).toBe(true);
    expect(warning.severity.isMedium()).toBe(true);
    expect(warning.description).toBe(
      'O colaborador foi flagrado utilizando celular em área restrita',
    );
    expect(warning.witnessName).toBe('João Silva');
  });

  it('should create a suspension with suspension days', async () => {
    const { warning } = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: testIssuer.id.toString(),
      type: 'SUSPENSION',
      severity: 'HIGH',
      reason: 'Falta grave com insubordinação',
      incidentDate: new Date('2024-03-20'),
      suspensionDays: 3,
    });

    expect(warning.type.isSuspension()).toBe(true);
    expect(warning.suspensionDays).toBe(3);
  });

  it('should throw error if employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        issuedBy: testIssuer.id.toString(),
        type: 'VERBAL',
        severity: 'LOW',
        reason: 'Atraso',
        incidentDate: new Date(),
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should throw error if issuer not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        issuedBy: new UniqueEntityID().toString(),
        type: 'VERBAL',
        severity: 'LOW',
        reason: 'Atraso',
        incidentDate: new Date(),
      }),
    ).rejects.toThrow('Issuer employee not found');
  });

  it('should throw error if employee is the issuer', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        issuedBy: testEmployee.id.toString(),
        type: 'VERBAL',
        severity: 'LOW',
        reason: 'Auto-advertência',
        incidentDate: new Date(),
      }),
    ).rejects.toThrow('O emissor não pode aplicar advertência em si mesmo');
  });

  it('should throw error if suspension type without suspension days', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        issuedBy: testIssuer.id.toString(),
        type: 'SUSPENSION',
        severity: 'HIGH',
        reason: 'Falta grave',
        incidentDate: new Date(),
      }),
    ).rejects.toThrow(
      'Dias de suspensão são obrigatórios para advertências do tipo suspensão',
    );
  });

  it('should throw error if suspension exceeds 30 days', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        issuedBy: testIssuer.id.toString(),
        type: 'SUSPENSION',
        severity: 'HIGH',
        reason: 'Falta grave',
        incidentDate: new Date(),
        suspensionDays: 31,
      }),
    ).rejects.toThrow('Suspensão não pode exceder 30 dias (CLT Art. 474)');
  });
});
