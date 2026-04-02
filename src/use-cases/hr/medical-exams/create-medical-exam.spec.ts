import { vi } from 'vitest';

vi.mock('@/services/esocial/auto-generate', () => ({
  tryAutoGenerateEvent: vi.fn().mockResolvedValue(undefined),
}));

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { beforeEach, describe, expect, it } from 'vitest'; // vi already imported above
import { CreateMedicalExamUseCase } from './create-medical-exam';

let medicalExamsRepository: InMemoryMedicalExamsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CreateMedicalExamUseCase;
const tenantId = new UniqueEntityID().toString();
let employeeId: string;

describe('Create Medical Exam Use Case', () => {
  beforeEach(async () => {
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreateMedicalExamUseCase(
      medicalExamsRepository,
      employeesRepository,
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

  it('should create a medical exam successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'ADMISSIONAL',
      examDate: new Date('2024-06-15'),
      doctorName: 'Dr. Ana Paula',
      doctorCrm: 'CRM/SP 123456',
      result: 'APTO',
    });

    expect(result.medicalExam).toBeDefined();
    expect(result.medicalExam.type).toBe('ADMISSIONAL');
    expect(result.medicalExam.doctorName).toBe('Dr. Ana Paula');
    expect(result.medicalExam.doctorCrm).toBe('CRM/SP 123456');
    expect(result.medicalExam.result).toBe('APTO');
    expect(result.medicalExam.employeeId.toString()).toBe(employeeId);
  });

  it('should create a medical exam with optional fields', async () => {
    const expirationDate = new Date('2025-06-15');

    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'PERIODICO',
      examDate: new Date('2024-06-15'),
      expirationDate,
      doctorName: 'Dr. Ana Paula',
      doctorCrm: 'CRM/SP 123456',
      result: 'APTO_COM_RESTRICOES',
      observations: 'Restrição para trabalho em altura',
      documentUrl: 'https://storage.example.com/exams/exam-001.pdf',
    });

    expect(result.medicalExam.expirationDate).toEqual(expirationDate);
    expect(result.medicalExam.observations).toBe(
      'Restrição para trabalho em altura',
    );
    expect(result.medicalExam.documentUrl).toBe(
      'https://storage.example.com/exams/exam-001.pdf',
    );
    expect(result.medicalExam.result).toBe('APTO_COM_RESTRICOES');
  });

  it('should throw error when employee does not exist', async () => {
    const nonExistentEmployeeId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        employeeId: nonExistentEmployeeId,
        type: 'ADMISSIONAL',
        examDate: new Date('2024-06-15'),
        doctorName: 'Dr. Ana Paula',
        doctorCrm: 'CRM/SP 123456',
        result: 'APTO',
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should throw error when doctor name is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId,
        type: 'ADMISSIONAL',
        examDate: new Date('2024-06-15'),
        doctorName: '',
        doctorCrm: 'CRM/SP 123456',
        result: 'APTO',
      }),
    ).rejects.toThrow('O nome do médico é obrigatório');
  });

  it('should throw error when doctor name is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId,
        type: 'ADMISSIONAL',
        examDate: new Date('2024-06-15'),
        doctorName: '   ',
        doctorCrm: 'CRM/SP 123456',
        result: 'APTO',
      }),
    ).rejects.toThrow('O nome do médico é obrigatório');
  });

  it('should throw error when doctor CRM is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId,
        type: 'ADMISSIONAL',
        examDate: new Date('2024-06-15'),
        doctorName: 'Dr. Ana Paula',
        doctorCrm: '',
        result: 'APTO',
      }),
    ).rejects.toThrow('O CRM do médico é obrigatório');
  });

  it('should throw error when doctor CRM is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId,
        type: 'ADMISSIONAL',
        examDate: new Date('2024-06-15'),
        doctorName: 'Dr. Ana Paula',
        doctorCrm: '   ',
        result: 'APTO',
      }),
    ).rejects.toThrow('O CRM do médico é obrigatório');
  });

  it('should trim doctor name and CRM', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'ADMISSIONAL',
      examDate: new Date('2024-06-15'),
      doctorName: '  Dr. Ana Paula  ',
      doctorCrm: '  CRM/SP 123456  ',
      result: 'APTO',
    });

    expect(result.medicalExam.doctorName).toBe('Dr. Ana Paula');
    expect(result.medicalExam.doctorCrm).toBe('CRM/SP 123456');
  });

  it('should trim observations when provided', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'PERIODICO',
      examDate: new Date('2024-06-15'),
      doctorName: 'Dr. Ana Paula',
      doctorCrm: 'CRM/SP 123456',
      result: 'APTO',
      observations: '  Sem restrições  ',
    });

    expect(result.medicalExam.observations).toBe('Sem restrições');
  });
});
