import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEsocialEventsRepository } from '@/repositories/esocial/in-memory/in-memory-esocial-events-repository';
import { InMemoryTrainingEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-training-enrollments-repository';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompleteEnrollmentUseCase } from './complete-enrollment';

let trainingEnrollmentsRepository: InMemoryTrainingEnrollmentsRepository;
let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let esocialEventsRepository: InMemoryEsocialEventsRepository;
let sut: CompleteEnrollmentUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Complete Enrollment Use Case', () => {
  beforeEach(() => {
    trainingEnrollmentsRepository = new InMemoryTrainingEnrollmentsRepository();
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    esocialEventsRepository = new InMemoryEsocialEventsRepository();
    sut = new CompleteEnrollmentUseCase(
      trainingEnrollmentsRepository,
      trainingProgramsRepository,
      esocialEventsRepository,
    );
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

  // ---------------------------------------------------------------------------
  // S-2240 auto-enqueue + expiration date (P0 safety)
  // ---------------------------------------------------------------------------

  it('should enqueue an S-2240 DRAFT event when completing a program flagged as mandatory for eSocial', async () => {
    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'NR-35 — Trabalho em Altura',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
      isMandatory: true,
      isMandatoryForESocial: true,
      validityMonths: 24,
    });

    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: program.id,
      employeeId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
      score: 95,
    });

    expect(result.esocialEventQueued).toBe(true);
    expect(esocialEventsRepository.items).toHaveLength(1);

    const queuedEvent = esocialEventsRepository.items[0];
    expect(queuedEvent.eventType).toBe('S_2240');
    expect(queuedEvent.status).toBe('DRAFT');
    expect(queuedEvent.referenceType).toBe('TRAINING_ENROLLMENT');
    expect(queuedEvent.referenceId).toBe(enrollment.id.toString());

    // expirationDate must be populated so the retraining cron can find it.
    expect(result.enrollment.expirationDate).toBeDefined();
    // 24 months ahead — allow a 5-second tolerance for test clock drift.
    const expectedExpiry = new Date();
    expectedExpiry.setMonth(expectedExpiry.getMonth() + 24);
    expect(
      Math.abs(
        result.enrollment.expirationDate!.getTime() - expectedExpiry.getTime(),
      ),
    ).toBeLessThan(5000);
  });

  it('should not queue any eSocial event when completing a non-mandatory program', async () => {
    const program = await trainingProgramsRepository.create({
      tenantId,
      name: 'Liderança Situacional',
      category: 'LEADERSHIP',
      format: 'ONLINE',
      durationHours: 12,
      isMandatory: false,
      isMandatoryForESocial: false,
      validityMonths: 36,
    });

    const enrollment = await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: program.id,
      employeeId: new UniqueEntityID(),
    });

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
    });

    expect(result.esocialEventQueued).toBe(false);
    expect(esocialEventsRepository.items).toHaveLength(0);
    // expirationDate must still be set (retraining reminder applies to every
    // completion, not just mandatory ones).
    expect(result.enrollment.expirationDate).toBeDefined();
  });
});
