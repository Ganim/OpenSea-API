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
import { CreateWarningUseCase } from '@/use-cases/hr/warnings/create-warning';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let warningsRepository: InMemoryEmployeeWarningsRepository;
let createWarning: CreateWarningUseCase;

let testEmployee: Employee;
let supervisorEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('[Integration] Warning Escalation Chain', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    warningsRepository = new InMemoryEmployeeWarningsRepository();

    createWarning = new CreateWarningUseCase(
      warningsRepository,
      employeesRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Marcos Pereira',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    supervisorEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'SUP001',
      fullName: 'Carolina Souza',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2020-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 8000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should follow the escalation chain: verbal → written → suspension', async () => {
    // Step 1: Verbal warning
    const { warning: verbalWarning } = await createWarning.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: supervisorEmployee.id.toString(),
      type: 'VERBAL',
      severity: 'LOW',
      reason: 'Atraso recorrente sem justificativa nos últimos 30 dias',
      incidentDate: new Date('2024-03-01'),
    });

    expect(verbalWarning.type.value).toBe('VERBAL');
    expect(verbalWarning.severity.value).toBe('LOW');

    // Step 2: Written warning (escalation)
    const { warning: writtenWarning } = await createWarning.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: supervisorEmployee.id.toString(),
      type: 'WRITTEN',
      severity: 'MEDIUM',
      reason:
        'Reincidência de atrasos após advertência verbal emitida em 01/03/2024',
      incidentDate: new Date('2024-04-15'),
    });

    expect(writtenWarning.type.value).toBe('WRITTEN');
    expect(writtenWarning.severity.value).toBe('MEDIUM');

    // Step 3: Suspension (further escalation)
    const { warning: suspensionWarning } = await createWarning.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: supervisorEmployee.id.toString(),
      type: 'SUSPENSION',
      severity: 'HIGH',
      reason:
        'Terceira ocorrência de descumprimento de horário após advertências verbal e escrita',
      incidentDate: new Date('2024-05-20'),
      suspensionDays: 3,
    });

    expect(suspensionWarning.type.value).toBe('SUSPENSION');
    expect(suspensionWarning.suspensionDays).toBe(3);

    // Verify escalation chain is recorded
    const employeeWarnings = await warningsRepository.findManyByEmployee(
      testEmployee.id,
      tenantId,
    );
    expect(employeeWarnings).toHaveLength(3);

    // Count active warnings
    const activeWarningCount = await warningsRepository.countActiveByEmployee(
      testEmployee.id,
      tenantId,
    );
    expect(activeWarningCount).toBe(3);
  });

  it('should enforce CLT Art. 474 — suspension cannot exceed 30 days', async () => {
    await expect(
      createWarning.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        issuedBy: supervisorEmployee.id.toString(),
        type: 'SUSPENSION',
        severity: 'HIGH',
        reason: 'Falta grave — tentativa de suspensão de 31 dias',
        incidentDate: new Date('2024-06-01'),
        suspensionDays: 31,
      }),
    ).rejects.toThrow('Suspensão não pode exceder 30 dias (CLT Art. 474)');
  });

  it('should require suspension days for SUSPENSION type', async () => {
    await expect(
      createWarning.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        issuedBy: supervisorEmployee.id.toString(),
        type: 'SUSPENSION',
        severity: 'HIGH',
        reason: 'Suspensão sem informar dias de afastamento',
        incidentDate: new Date('2024-06-01'),
      }),
    ).rejects.toThrow(
      'Dias de suspensão são obrigatórios para advertências do tipo suspensão',
    );
  });

  it('should not allow self-issued warning', async () => {
    await expect(
      createWarning.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        issuedBy: testEmployee.id.toString(),
        type: 'VERBAL',
        severity: 'LOW',
        reason:
          'Tentativa de auto-advertência — deve ser bloqueada pelo sistema',
        incidentDate: new Date('2024-06-01'),
      }),
    ).rejects.toThrow('O emissor não pode aplicar advertência em si mesmo');
  });

  it('should allow maximum 30-day suspension (CLT boundary)', async () => {
    const { warning } = await createWarning.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: supervisorEmployee.id.toString(),
      type: 'SUSPENSION',
      severity: 'HIGH',
      reason: 'Falta grave justificada — suspensão máxima permitida pela CLT',
      incidentDate: new Date('2024-06-01'),
      suspensionDays: 30, // Exactly at the CLT limit
    });

    expect(warning.suspensionDays).toBe(30);
    expect(warning.type.value).toBe('SUSPENSION');
  });

  it('should track multiple warnings from different issuers', async () => {
    // Create another supervisor
    const secondSupervisor = await employeesRepository.create({
      tenantId,
      registrationNumber: 'SUP002',
      fullName: 'Roberto Lima',
      cpf: CPF.create('987.654.321-00'),
      hireDate: new Date('2019-06-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 9000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Warning from first supervisor
    await createWarning.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: supervisorEmployee.id.toString(),
      type: 'VERBAL',
      severity: 'LOW',
      reason: 'Atraso no horário de entrada registrado pelo supervisor direto',
      incidentDate: new Date('2024-03-01'),
    });

    // Warning from second supervisor
    await createWarning.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      issuedBy: secondSupervisor.id.toString(),
      type: 'WRITTEN',
      severity: 'MEDIUM',
      reason:
        'Descumprimento de procedimento de segurança observado pelo gerente de área',
      incidentDate: new Date('2024-03-15'),
    });

    const allWarnings = await warningsRepository.findManyByEmployee(
      testEmployee.id,
      tenantId,
    );

    expect(allWarnings).toHaveLength(2);
    const issuers = allWarnings.map((w) => w.issuedBy.toString());
    expect(issuers).toContain(supervisorEmployee.id.toString());
    expect(issuers).toContain(secondSupervisor.id.toString());
  });
});
