import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewsRepository } from '@/repositories/hr/in-memory/in-memory-interviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelInterviewUseCase } from './cancel-interview';

let interviewsRepository: InMemoryInterviewsRepository;
let sut: CancelInterviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Cancel Interview Use Case', () => {
  beforeEach(() => {
    interviewsRepository = new InMemoryInterviewsRepository();
    sut = new CancelInterviewUseCase(interviewsRepository);
  });

  it('should cancel a scheduled interview', async () => {
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
    });

    expect(result.interview.status).toBe('CANCELLED');
  });

  it('should throw error when cancelling non-scheduled interview', async () => {
    const interview = await interviewsRepository.create({
      tenantId,
      applicationId: new UniqueEntityID().toString(),
      interviewStageId: new UniqueEntityID().toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: new Date(),
    });

    // Cancel once
    await sut.execute({
      tenantId,
      interviewId: interview.id.toString(),
    });

    // Try again
    await expect(
      sut.execute({
        tenantId,
        interviewId: interview.id.toString(),
      }),
    ).rejects.toThrow('Apenas entrevistas agendadas podem ser canceladas');
  });
});
