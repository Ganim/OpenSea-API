import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-training-enrollments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelEnrollmentUseCase } from './cancel-enrollment';

let trainingEnrollmentsRepository: InMemoryTrainingEnrollmentsRepository;
let sut: CancelEnrollmentUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Cancel Enrollment Use Case', () => {
  beforeEach(() => {
    trainingEnrollmentsRepository = new InMemoryTrainingEnrollmentsRepository();
    sut = new CancelEnrollmentUseCase(trainingEnrollmentsRepository);
  });

  it('should cancel an enrollment', async () => {
    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
    });

    expect(result.enrollment.status).toBe('CANCELLED');
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
    ).rejects.toThrow('Não é possível cancelar uma inscrição já concluída');
  });

  it('should throw error for already cancelled enrollment', async () => {
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
    ).rejects.toThrow('Esta inscrição já está cancelada');
  });
});
