import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewsRepository } from '@/repositories/hr/in-memory/in-memory-interviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompleteInterviewUseCase } from './complete-interview';

let interviewsRepository: InMemoryInterviewsRepository;
let sut: CompleteInterviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Complete Interview Use Case', () => {
  beforeEach(() => {
    interviewsRepository = new InMemoryInterviewsRepository();
    sut = new CompleteInterviewUseCase(interviewsRepository);
  });

  it('should complete an interview with feedback', async () => {
    const interview = await interviewsRepository.create({
      tenantId,
      applicationId: new UniqueEntityID().toString(),
      interviewStageId: new UniqueEntityID().toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      interviewId: interview.id.toString(),
      feedback: 'Excelente candidato, bom conhecimento técnico',
      rating: 5,
      recommendation: 'ADVANCE',
    });

    expect(result.interview.status).toBe('COMPLETED');
    expect(result.interview.feedback).toBe(
      'Excelente candidato, bom conhecimento técnico',
    );
    expect(result.interview.rating).toBe(5);
    expect(result.interview.recommendation).toBe('ADVANCE');
    expect(result.interview.completedAt).toBeDefined();
  });

  it('should throw error for non-scheduled interview', async () => {
    const interview = await interviewsRepository.create({
      tenantId,
      applicationId: new UniqueEntityID().toString(),
      interviewStageId: new UniqueEntityID().toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: new Date(),
    });

    // Complete once
    await sut.execute({
      tenantId,
      interviewId: interview.id.toString(),
      feedback: 'Good',
      rating: 4,
      recommendation: 'ADVANCE',
    });

    // Try to complete again
    await expect(
      sut.execute({
        tenantId,
        interviewId: interview.id.toString(),
        feedback: 'Good again',
        rating: 3,
        recommendation: 'HOLD',
      }),
    ).rejects.toThrow(
      'Apenas entrevistas agendadas podem ser concluídas',
    );
  });

  it('should throw error for invalid rating', async () => {
    const interview = await interviewsRepository.create({
      tenantId,
      applicationId: new UniqueEntityID().toString(),
      interviewStageId: new UniqueEntityID().toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        interviewId: interview.id.toString(),
        feedback: 'Feedback',
        rating: 6,
        recommendation: 'ADVANCE',
      }),
    ).rejects.toThrow('A avaliação deve ser entre 1 e 5');
  });

  it('should throw error for invalid recommendation', async () => {
    const interview = await interviewsRepository.create({
      tenantId,
      applicationId: new UniqueEntityID().toString(),
      interviewStageId: new UniqueEntityID().toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        interviewId: interview.id.toString(),
        feedback: 'Feedback',
        rating: 3,
        recommendation: 'INVALID',
      }),
    ).rejects.toThrow('Recomendação inválida');
  });
});
