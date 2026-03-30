import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { PIS } from '@/entities/hr/value-objects/pis';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';
import { NoticeType, TerminationType } from '@/entities/hr/termination';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateCagedReportUseCase } from './generate-caged-report';

let employeesRepository: InMemoryEmployeesRepository;
let terminationsRepository: InMemoryTerminationsRepository;
let sut: GenerateCagedReportUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Generate CAGED Report Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    terminationsRepository = new InMemoryTerminationsRepository();
    sut = new GenerateCagedReportUseCase(
      employeesRepository,
      terminationsRepository,
    );
  });

  it('should generate CAGED report with admissions in the period', async () => {
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Julia Martins',
      cpf: CPF.create('52998224725'),
      pis: PIS.create('12345678900'),
      hireDate: new Date(2024, 2, 10), // March 10, 2024 (local)
      birthDate: new Date(1995, 7, 20),
      gender: 'F',
      baseSalary: 4000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.year).toBe(2024);
    expect(result.month).toBe(3);
    expect(result.totalAdmissions).toBe(1);
    expect(result.totalTerminations).toBe(0);
    expect(result.netBalance).toBe(1);

    const admission = result.admissions[0];
    expect(admission.fullName).toBe('Julia Martins');
    expect(admission.cpf).toBe('52998224725');
    expect(admission.pis).toBe('12345678900');
    expect(admission.contractType).toBe('CLT');
    expect(admission.baseSalary).toBe(4000);
  });

  it('should generate CAGED report with terminations in the period', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Henrique Nunes',
      cpf: CPF.create('71428793860'),
      hireDate: new Date(2022, 5, 1), // June 1, 2022
      terminationDate: new Date(2024, 2, 15), // March 15, 2024
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('TERMINATED'),
    });

    await terminationsRepository.create({
      tenantId,
      employeeId: employee.id,
      type: TerminationType.PEDIDO_DEMISSAO,
      terminationDate: new Date(2024, 2, 15),
      lastWorkDay: new Date(2024, 2, 15),
      noticeType: NoticeType.TRABALHADO,
      noticeDays: 30,
      paymentDeadline: new Date(2024, 2, 25),
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.totalAdmissions).toBe(0);
    expect(result.totalTerminations).toBe(1);
    expect(result.netBalance).toBe(-1);

    const termination = result.terminations[0];
    expect(termination.fullName).toBe('Henrique Nunes');
    expect(termination.terminationType).toBe('PEDIDO_DEMISSAO');
  });

  it('should include both admissions and terminations in the same period', async () => {
    // Admission
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP003',
      fullName: 'Ana Beatriz',
      cpf: CPF.create('52998224725'),
      hireDate: new Date(2024, 2, 5), // March 5, 2024
      baseSalary: 3500,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    // Termination
    const terminatedEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP004',
      fullName: 'Felipe Gomes',
      cpf: CPF.create('71428793860'),
      hireDate: new Date(2021, 0, 10), // Jan 10, 2021
      terminationDate: new Date(2024, 2, 20), // March 20, 2024
      baseSalary: 6000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('TERMINATED'),
    });

    await terminationsRepository.create({
      tenantId,
      employeeId: terminatedEmployee.id,
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate: new Date(2024, 2, 20),
      lastWorkDay: new Date(2024, 2, 20),
      noticeType: NoticeType.INDENIZADO,
      noticeDays: 30,
      paymentDeadline: new Date(2024, 2, 30),
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.totalAdmissions).toBe(1);
    expect(result.totalTerminations).toBe(1);
    expect(result.netBalance).toBe(0);
  });

  it('should not include admissions from other months', async () => {
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP005',
      fullName: 'Lucas Ferreira',
      cpf: CPF.create('52998224725'),
      hireDate: new Date(2024, 1, 15), // February 15, 2024
      baseSalary: 4500,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.totalAdmissions).toBe(0);
  });

  it('should return empty report when no movements in the period', async () => {
    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.totalAdmissions).toBe(0);
    expect(result.totalTerminations).toBe(0);
    expect(result.netBalance).toBe(0);
    expect(result.admissions).toHaveLength(0);
    expect(result.terminations).toHaveLength(0);
  });

  it('should sort admissions and terminations alphabetically', async () => {
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP006',
      fullName: 'Zélia Souza',
      cpf: CPF.create('52998224725'),
      hireDate: new Date(2024, 2, 1), // March 1, 2024
      baseSalary: 3000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP007',
      fullName: 'Amanda Ribeiro',
      cpf: CPF.create('71428793860'),
      hireDate: new Date(2024, 2, 15), // March 15, 2024
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.admissions[0].fullName).toBe('Amanda Ribeiro');
    expect(result.admissions[1].fullName).toBe('Zélia Souza');
  });

  it('should handle multiple termination types', async () => {
    const emp1 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP008',
      fullName: 'Carlos Dias',
      cpf: CPF.create('52998224725'),
      hireDate: new Date(2020, 0, 1), // Jan 1, 2020
      terminationDate: new Date(2024, 2, 10), // March 10, 2024
      baseSalary: 4000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('TERMINATED'),
    });

    const emp2 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP009',
      fullName: 'Daniela Rocha',
      cpf: CPF.create('71428793860'),
      hireDate: new Date(2021, 5, 1), // June 1, 2021
      terminationDate: new Date(2024, 2, 25), // March 25, 2024
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('TERMINATED'),
    });

    await terminationsRepository.create({
      tenantId,
      employeeId: emp1.id,
      type: TerminationType.JUSTA_CAUSA,
      terminationDate: new Date(2024, 2, 10),
      lastWorkDay: new Date(2024, 2, 10),
      noticeType: NoticeType.DISPENSADO,
      noticeDays: 0,
      paymentDeadline: new Date(2024, 2, 20),
    });

    await terminationsRepository.create({
      tenantId,
      employeeId: emp2.id,
      type: TerminationType.ACORDO_MUTUO,
      terminationDate: new Date(2024, 2, 25),
      lastWorkDay: new Date(2024, 2, 25),
      noticeType: NoticeType.INDENIZADO,
      noticeDays: 15,
      paymentDeadline: new Date(2024, 3, 4),
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.totalTerminations).toBe(2);
    // Sorted alphabetically
    expect(result.terminations[0].fullName).toBe('Carlos Dias');
    expect(result.terminations[0].terminationType).toBe('JUSTA_CAUSA');
    expect(result.terminations[1].fullName).toBe('Daniela Rocha');
    expect(result.terminations[1].terminationType).toBe('ACORDO_MUTUO');
  });
});
