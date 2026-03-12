import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateEmployeesReportUseCase } from './generate-employees-report';

let employeesRepository: InMemoryEmployeesRepository;
let sut: GenerateEmployeesReportUseCase;
const tenantId = new UniqueEntityID().toString();

function makeEmployee(
  overrides: Partial<{
    tenantId: string;
    registrationNumber: string;
    fullName: string;
    cpf: string;
    departmentId: UniqueEntityID;
    positionId: UniqueEntityID;
    companyId: UniqueEntityID;
    contractType: string;
    workRegime: string;
  }> = {},
) {
  return {
    tenantId: overrides.tenantId ?? tenantId,
    registrationNumber: overrides.registrationNumber ?? 'EMP001',
    fullName: overrides.fullName ?? 'João Silva',
    cpf: CPF.create(overrides.cpf ?? '529.982.247-25'),
    hireDate: new Date('2024-01-15'),
    baseSalary: 3000,
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.create(overrides.contractType ?? 'CLT'),
    workRegime: WorkRegime.create(overrides.workRegime ?? 'FULL_TIME'),
    weeklyHours: 44,
    country: 'Brasil',
    departmentId: overrides.departmentId,
    positionId: overrides.positionId,
    companyId: overrides.companyId,
    metadata: {},
    pendingIssues: [],
    pcd: false,
  };
}

describe('Generate Employees Report Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GenerateEmployeesReportUseCase(employeesRepository);
  });

  it('should generate CSV with correct headers and employee data', async () => {
    await employeesRepository.create(
      makeEmployee({
        registrationNumber: 'EMP001',
        fullName: 'João Silva',
        cpf: '529.982.247-25',
        contractType: 'CLT',
        workRegime: 'FULL_TIME',
      }),
    );

    await employeesRepository.create(
      makeEmployee({
        registrationNumber: 'EMP002',
        fullName: 'Maria Souza',
        cpf: '123.456.789-09',
        contractType: 'PJ',
        workRegime: 'PART_TIME',
      }),
    );

    const result = await sut.execute({ tenantId });

    // BOM prefix
    expect(result.csv.startsWith('\uFEFF')).toBe(true);

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(3); // header + 2 rows

    // Header
    expect(lines[0]).toContain('Nome Completo');
    expect(lines[0]).toContain('Matrícula');
    expect(lines[0]).toContain('CPF');
    expect(lines[0]).toContain('Status');
    expect(lines[0]).toContain('Tipo de Contrato');
    expect(lines[0]).toContain('Regime de Trabalho');

    // Employee data rows
    expect(lines[1]).toContain('"João Silva"');
    expect(lines[1]).toContain('"EMP001"');
    expect(lines[1]).toContain('"Ativo"');
    expect(lines[1]).toContain('"CLT"');
    expect(lines[1]).toContain('"Integral"');

    expect(lines[2]).toContain('"Maria Souza"');
    expect(lines[2]).toContain('"Pessoa Jurídica"');
    expect(lines[2]).toContain('"Meio Período"');

    // CPF masked
    expect(lines[1]).toContain('"***.***.***-25"');

    // File name
    expect(result.fileName).toMatch(/^funcionarios_\d{2}-\d{2}-\d{4}\.csv$/);
  });

  it('should return header-only CSV when no employees exist', async () => {
    const result = await sut.execute({ tenantId });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Nome Completo');
    expect(lines[0]).toContain('Matrícula');
  });

  it('should filter employees by status', async () => {
    await employeesRepository.create(makeEmployee());

    const result = await sut.execute({
      tenantId,
      status: 'TERMINATED',
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(1); // header only
  });

  it('should filter employees by departmentId', async () => {
    const departmentId = new UniqueEntityID();

    await employeesRepository.create(
      makeEmployee({
        registrationNumber: 'EMP001',
        fullName: 'João Silva',
        departmentId,
      }),
    );

    await employeesRepository.create(
      makeEmployee({
        registrationNumber: 'EMP002',
        fullName: 'Maria Souza',
        cpf: '123.456.789-09',
      }),
    );

    const result = await sut.execute({
      tenantId,
      departmentId: departmentId.toString(),
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(2); // header + 1 matching employee
    expect(lines[1]).toContain('"João Silva"');
  });

  it('should not include employees from another tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await employeesRepository.create(
      makeEmployee({
        tenantId: otherTenantId,
      }),
    );

    const result = await sut.execute({ tenantId });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines.length).toBe(1);
  });

  it('should use semicolon as CSV delimiter', async () => {
    await employeesRepository.create(makeEmployee());

    const result = await sut.execute({ tenantId });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[0].split(';').length).toBe(10);
    expect(lines[1].split(';').length).toBe(10);
  });
});
