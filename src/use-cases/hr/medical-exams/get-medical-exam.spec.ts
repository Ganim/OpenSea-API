import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMedicalExamUseCase } from './get-medical-exam';

let medicalExamsRepository: InMemoryMedicalExamsRepository;
let sut: GetMedicalExamUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Get Medical Exam Use Case', () => {
  beforeEach(() => {
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    sut = new GetMedicalExamUseCase(medicalExamsRepository);
  });

  it('should get a medical exam by id', async () => {
    const createdExam = await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(),
      type: 'ADMISSIONAL',
      examDate: new Date('2024-06-15'),
      doctorName: 'Dr. Carlos Mendes',
      doctorCrm: 'CRM/RJ 654321',
      result: 'APTO',
    });

    const result = await sut.execute({
      tenantId,
      examId: createdExam.id.toString(),
    });

    expect(result.medicalExam).toBeDefined();
    expect(result.medicalExam.id.equals(createdExam.id)).toBe(true);
    expect(result.medicalExam.doctorName).toBe('Dr. Carlos Mendes');
    expect(result.medicalExam.type).toBe('ADMISSIONAL');
  });

  it('should throw error when exam does not exist', async () => {
    const nonExistentExamId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        examId: nonExistentExamId,
      }),
    ).rejects.toThrow('Exame médico não encontrado');
  });

  it('should throw error when exam belongs to different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    const createdExam = await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(),
      type: 'PERIODICO',
      examDate: new Date('2024-06-15'),
      doctorName: 'Dr. Carlos Mendes',
      doctorCrm: 'CRM/RJ 654321',
      result: 'APTO',
    });

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        examId: createdExam.id.toString(),
      }),
    ).rejects.toThrow('Exame médico não encontrado');
  });
});
