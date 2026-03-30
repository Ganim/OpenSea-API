import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewsRepository } from '@/repositories/hr/in-memory/in-memory-interviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListInterviewsUseCase } from './list-interviews';

let interviewsRepository: InMemoryInterviewsRepository;
let sut: ListInterviewsUseCase;

const tenantId = new UniqueEntityID().toString();
const applicationId = new UniqueEntityID().toString();

describe('List Interviews Use Case', () => {
  beforeEach(async () => {
    interviewsRepository = new InMemoryInterviewsRepository();
    sut = new ListInterviewsUseCase(interviewsRepository);

    await interviewsRepository.create({
      tenantId,
      applicationId,
      interviewStageId: new UniqueEntityID().toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: new Date('2026-04-01'),
    });
    await interviewsRepository.create({
      tenantId,
      applicationId,
      interviewStageId: new UniqueEntityID().toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: new Date('2026-04-05'),
    });
  });

  it('should list all interviews', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.interviews).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by application', async () => {
    const result = await sut.execute({ tenantId, applicationId });

    expect(result.interviews).toHaveLength(2);
  });
});
