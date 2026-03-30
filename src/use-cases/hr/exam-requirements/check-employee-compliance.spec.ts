import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CPF,
  ContractType,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { InMemoryOccupationalExamRequirementsRepository } from '@/repositories/hr/in-memory/in-memory-occupational-exam-requirements-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckEmployeeComplianceUseCase } from './check-employee-compliance';

let employeesRepository: InMemoryEmployeesRepository;
let medicalExamsRepository: InMemoryMedicalExamsRepository;
let examRequirementsRepository: InMemoryOccupationalExamRequirementsRepository;
let sut: CheckEmployeeComplianceUseCase;
const tenantId = new UniqueEntityID().toString();
let employeeId: string;

describe('Check Employee Compliance Use Case', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    examRequirementsRepository =
      new InMemoryOccupationalExamRequirementsRepository();

    sut = new CheckEmployeeComplianceUseCase(
      employeesRepository,
      medicalExamsRepository,
      examRequirementsRepository,
    );

    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Carlos Oliveira',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      status: EmployeeStatus.create('ACTIVE'),
      weeklyHours: 44,
      country: 'Brasil',
    });

    employeeId = employee.id.toString();
  });

  it('should return COMPLIANT when all requirements have valid exams', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    // Create a requirement
    await examRequirementsRepository.create({
      tenantId,
      examType: 'AUDIOMETRIA',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
    });

    // Create a matching valid exam
    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'AUDIOMETRIA',
      examDate: new Date('2024-06-15'),
      expirationDate: futureDate,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    const compliance = await sut.execute({ tenantId, employeeId });

    expect(compliance.overallStatus).toBe('COMPLIANT');
    expect(compliance.compliantCount).toBe(1);
    expect(compliance.overdueCount).toBe(0);
    expect(compliance.missingCount).toBe(0);
  });

  it('should return NON_COMPLIANT when exam is missing', async () => {
    await examRequirementsRepository.create({
      tenantId,
      examType: 'AUDIOMETRIA',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
    });

    const compliance = await sut.execute({ tenantId, employeeId });

    expect(compliance.overallStatus).toBe('NON_COMPLIANT');
    expect(compliance.missingCount).toBe(1);
    expect(compliance.complianceItems[0].status).toBe('MISSING');
  });

  it('should return NON_COMPLIANT when exam is overdue', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);

    await examRequirementsRepository.create({
      tenantId,
      examType: 'HEMOGRAMA',
      examCategory: 'PERIODICO',
      frequencyMonths: 6,
    });

    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'HEMOGRAMA',
      examDate: new Date('2023-01-15'),
      expirationDate: pastDate,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    const compliance = await sut.execute({ tenantId, employeeId });

    expect(compliance.overallStatus).toBe('NON_COMPLIANT');
    expect(compliance.overdueCount).toBe(1);
    expect(compliance.complianceItems[0].status).toBe('OVERDUE');
  });

  it('should detect expiring exams', async () => {
    const in20Days = new Date();
    in20Days.setDate(in20Days.getDate() + 20);

    await examRequirementsRepository.create({
      tenantId,
      examType: 'ACUIDADE_VISUAL',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
    });

    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'ACUIDADE_VISUAL',
      examDate: new Date('2024-01-15'),
      expirationDate: in20Days,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    const compliance = await sut.execute({ tenantId, employeeId });

    expect(compliance.expiringCount).toBe(1);
    expect(compliance.complianceItems[0].status).toBe('EXPIRING');
    expect(compliance.complianceItems[0].daysUntilExpiry).toBeLessThanOrEqual(
      20,
    );
  });

  it('should throw error when employee does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({ tenantId, employeeId: nonExistentId }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should return empty compliance when no requirements exist', async () => {
    const compliance = await sut.execute({ tenantId, employeeId });

    expect(compliance.overallStatus).toBe('COMPLIANT');
    expect(compliance.totalRequirements).toBe(0);
    expect(compliance.complianceItems).toHaveLength(0);
  });
});
