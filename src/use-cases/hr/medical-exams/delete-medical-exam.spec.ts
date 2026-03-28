import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryMedicalExamsRepository } from '@/repositories/hr/in-memory/in-memory-medical-exams-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteMedicalExamUseCase } from './delete-medical-exam';

let medicalExamsRepository: InMemoryMedicalExamsRepository;
let sut: DeleteMedicalExamUseCase;
const tenantId = new UniqueEntityID().toString();
let existingExamId: string;

describe('Delete Medical Exam Use Case', () => {
  beforeEach(async () => {
    medicalExamsRepository = new InMemoryMedicalExamsRepository();
    sut = new DeleteMedicalExamUseCase(medicalExamsRepository);

    const createdExam = await medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(),
      type: 'PERIODICO',
      examDate: new Date('2024-06-15'),
      doctorName: 'Dr. Ana Paula',
      doctorCrm: 'CRM/SP 123456',
      result: 'APTO',
    });

    existingExamId = createdExam.id.toString();
  });

  it('should delete a medical exam successfully', async () => {
    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
    });

    expect(result.medicalExam).toBeDefined();
    expect(result.medicalExam.id.toString()).toBe(existingExamId);

    // Verify it was actually deleted
    const findResult = await medicalExamsRepository.findById(
      new UniqueEntityID(existingExamId),
      tenantId,
    );
    expect(findResult).toBeNull();
  });

  it('should return the deleted exam data', async () => {
    const result = await sut.execute({
      tenantId,
      examId: existingExamId,
    });

    expect(result.medicalExam.doctorName).toBe('Dr. Ana Paula');
    expect(result.medicalExam.type).toBe('PERIODICO');
    expect(result.medicalExam.result).toBe('APTO');
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

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        examId: existingExamId,
      }),
    ).rejects.toThrow('Exame médico não encontrado');
  });

  it('should not find exam after deletion', async () => {
    await sut.execute({
      tenantId,
      examId: existingExamId,
    });

    // Trying to delete again should fail
    await expect(
      sut.execute({
        tenantId,
        examId: existingExamId,
      }),
    ).rejects.toThrow('Exame médico não encontrado');
  });
});
