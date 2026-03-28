import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateMedicalExamUseCase } from './update-medical-exam';

let medicalExamsRepository: InMemoryMedicalExamsRepository;
let sut: UpdateMedicalExamUseCase;
const tenantId = new UniqueEntityID().toString();
let existingExamId: string;

describe('Update Medical Exam Use Case', () => {
  beforeEach(async () => {
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    sut = new UpdateMedicalExamUseCase(medicalExamsRepository);

    const createdExam = await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(),
      type: 'ADMISSIONAL',
      examDate: new Date('2024-06-15'),
      doctorName: 'Dr. Ana Paula',
      doctorCrm: 'CRM/SP 123456',
      result: 'APTO',
    });

    existingExamId = createdExam.id.toString();
  });

  it('should update a medical exam successfully', async () => {
    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
      result: 'INAPTO',
      observations: 'Paciente apresentou condição impeditiva',
    });

    expect(result.medicalExam).toBeDefined();
    expect(result.medicalExam.result).toBe('INAPTO');
    expect(result.medicalExam.observations).toBe(
      'Paciente apresentou condição impeditiva',
    );
  });

  it('should update doctor name and CRM', async () => {
    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
      doctorName: 'Dr. Roberto Lima',
      doctorCrm: 'CRM/RJ 654321',
    });

    expect(result.medicalExam.doctorName).toBe('Dr. Roberto Lima');
    expect(result.medicalExam.doctorCrm).toBe('CRM/RJ 654321');
  });

  it('should update exam type and date', async () => {
    const newExamDate = new Date('2024-07-01');

    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
      type: 'PERIODICO',
      examDate: newExamDate,
    });

    expect(result.medicalExam.type).toBe('PERIODICO');
    expect(result.medicalExam.examDate).toEqual(newExamDate);
  });

  it('should update expiration date and document URL', async () => {
    const expirationDate = new Date('2025-06-15');

    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
      expirationDate,
      documentUrl: 'https://storage.example.com/exams/updated.pdf',
    });

    expect(result.medicalExam.expirationDate).toEqual(expirationDate);
    expect(result.medicalExam.documentUrl).toBe(
      'https://storage.example.com/exams/updated.pdf',
    );
  });

  it('should trim updated doctor name and CRM', async () => {
    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
      doctorName: '  Dr. Carlos Mendes  ',
      doctorCrm: '  CRM/MG 789012  ',
    });

    expect(result.medicalExam.doctorName).toBe('Dr. Carlos Mendes');
    expect(result.medicalExam.doctorCrm).toBe('CRM/MG 789012');
  });

  it('should throw error when exam does not exist', async () => {
    const nonExistentExamId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        examId: nonExistentExamId,
        result: 'INAPTO',
      }),
    ).rejects.toThrow('Exame médico não encontrado');
  });

  it('should throw error when exam belongs to different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        examId: existingExamId,
        result: 'INAPTO',
      }),
    ).rejects.toThrow('Exame médico não encontrado');
  });

  it('should preserve unchanged fields during partial update', async () => {
    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
      observations: 'Nova observação',
    });

    expect(result.medicalExam.type).toBe('ADMISSIONAL');
    expect(result.medicalExam.doctorName).toBe('Dr. Ana Paula');
    expect(result.medicalExam.doctorCrm).toBe('CRM/SP 123456');
    expect(result.medicalExam.result).toBe('APTO');
    expect(result.medicalExam.observations).toBe('Nova observação');
  });
});
