import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-training-enrollments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompleteEnrollmentUseCase } from './complete-enrollment';

let trainingEnrollmentsRepository: InMemoryTrainingEnrollmentsRepository;
let sut: CompleteEnrollmentUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Complete Enrollment Use Case', () => {
  beforeEach(() => {
    trainingEnrollmentsRepository = new InMemoryTrainingEnrollmentsRepository();
    sut = new CompleteEnrollmentUseCase(trainingEnrollmentsRepository);
  });

  it('should complete an enrollment', async () => {
    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
      score: 95,
      certificateUrl: 'https://certs.example.com/123',
    });

    expect(result.enrollment.status).toBe('COMPLETED');
    expect(result.enrollment.score).toBe(95);
    expect(result.enrollment.certificateUrl).toBe(
      'https://certs.example.com/123',
    );
  });

  it('should throw error for non-existent enrollment', async () => {
    await expect(
      sut.execute({
        tenantId,
        enrollmentId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Inscrição não encontrada');
  });

  it('should throw error for already completed enrollment', async () => {
    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
      }),
    ).rejects.toThrow('Esta inscrição já foi concluída');
  });

  it('should throw error for cancelled enrollment', async () => {
    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
      }),
    ).rejects.toThrow('Não é possível concluir uma inscrição cancelada');
  });

  it('should throw error for score out of range', async () => {
    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
    });

    await expect(
      sut.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        score: 150,
      }),
    ).rejects.toThrow('A nota deve estar entre 0 e 100');
  });
});
