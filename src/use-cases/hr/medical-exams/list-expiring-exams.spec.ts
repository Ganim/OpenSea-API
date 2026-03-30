import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CPF,
  ContractType,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListExpiringExamsUseCase } from './list-expiring-exams';

let medicalExamsRepository: InMemoryMedicalExamsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListExpiringExamsUseCase;
const tenantId = new UniqueEntityID().toString();
let employeeId: string;

describe('List Expiring Exams Use Case', () => {
  beforeEach(async () => {
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListExpiringExamsUseCase(medicalExamsRepository);

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

  it('should return exams expiring within the threshold', async () => {
    const now = new Date();
    const in15Days = new Date(now);
    in15Days.setDate(in15Days.getDate() + 15);
    const in60Days = new Date(now);
    in60Days.setDate(in60Days.getDate() + 60);

    // Expiring in 15 days (should be returned with 30-day default)
    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'PERIODICO',
      examDate: new Date('2024-01-15'),
      expirationDate: in15Days,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    // Expiring in 60 days (should NOT be returned with 30-day default)
    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'ADMISSIONAL',
      examDate: new Date('2024-02-15'),
      expirationDate: in60Days,
      doctorName: 'Dr. Pedro',
      doctorCrm: 'CRM/SP 222',
      result: 'APTO',
    });

    const { expiringExams } = await sut.execute({ tenantId });

    expect(expiringExams).toHaveLength(1);
    expect(expiringExams[0].type).toBe('PERIODICO');
  });

  it('should respect custom days threshold', async () => {
    const now = new Date();
    const in45Days = new Date(now);
    in45Days.setDate(in45Days.getDate() + 45);

    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'PERIODICO',
      examDate: new Date('2024-01-15'),
      expirationDate: in45Days,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    // With 30-day threshold, should not be returned
    const result30 = await sut.execute({ tenantId, daysThreshold: 30 });
    expect(result30.expiringExams).toHaveLength(0);

    // With 60-day threshold, should be returned
    const result60 = await sut.execute({ tenantId, daysThreshold: 60 });
    expect(result60.expiringExams).toHaveLength(1);
  });

  it('should return empty array when no exams are expiring', async () => {
    const { expiringExams } = await sut.execute({ tenantId });
    expect(expiringExams).toHaveLength(0);
  });

  it('should not return already expired exams', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'PERIODICO',
      examDate: new Date('2023-01-15'),
      expirationDate: yesterday,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    const { expiringExams } = await sut.execute({ tenantId });
    expect(expiringExams).toHaveLength(0);
  });
});
