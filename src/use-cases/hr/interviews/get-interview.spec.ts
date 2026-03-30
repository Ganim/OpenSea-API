import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewsRepository } from '@/repositories/hr/in-memory/in-memory-interviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetInterviewUseCase } from './get-interview';

let interviewsRepository: InMemoryInterviewsRepository;
let sut: GetInterviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Interview Use Case', () => {
  beforeEach(() => {
    interviewsRepository = new InMemoryInterviewsRepository();
    sut = new GetInterviewUseCase(interviewsRepository);
  });

  it('should get an interview by id', async () => {
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

    expect(result.interview).toBeDefined();
    expect(result.interview.status).toBe('SCHEDULED');
  });

  it('should throw error for non-existing interview', async () => {
    await expect(
      sut.execute({
        tenantId,
        interviewId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Entrevista não encontrada');
  });
});
