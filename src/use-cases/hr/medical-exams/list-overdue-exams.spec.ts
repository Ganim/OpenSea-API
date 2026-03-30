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
import { ListOverdueExamsUseCase } from './list-overdue-exams';

let medicalExamsRepository: InMemoryMedicalExamsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListOverdueExamsUseCase;
const tenantId = new UniqueEntityID().toString();
let employeeId: string;

describe('List Overdue Exams Use Case', () => {
  beforeEach(async () => {
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListOverdueExamsUseCase(medicalExamsRepository);

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

  it('should return overdue exams', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'PERIODICO',
      examDate: new Date('2023-01-15'),
      expirationDate: pastDate,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    const { overdueExams } = await sut.execute({ tenantId });

    expect(overdueExams).toHaveLength(1);
    expect(overdueExams[0].type).toBe('PERIODICO');
  });

  it('should not return valid exams', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);

    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'PERIODICO',
      examDate: new Date('2024-01-15'),
      expirationDate: futureDate,
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    const { overdueExams } = await sut.execute({ tenantId });
    expect(overdueExams).toHaveLength(0);
  });

  it('should not return exams without expiration date', async () => {
    await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type: 'ADMISSIONAL',
      examDate: new Date('2024-01-15'),
      doctorName: 'Dr. Ana',
      doctorCrm: 'CRM/SP 111',
      result: 'APTO',
    });

    const { overdueExams } = await sut.execute({ tenantId });
    expect(overdueExams).toHaveLength(0);
  });

  it('should return empty array when no overdue exams exist', async () => {
    const { overdueExams } = await sut.execute({ tenantId });
    expect(overdueExams).toHaveLength(0);
  });
});
