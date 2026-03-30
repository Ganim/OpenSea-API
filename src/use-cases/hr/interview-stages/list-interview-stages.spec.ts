import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewStagesRepository } from '@/repositories/hr/in-memory/in-memory-interview-stages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListInterviewStagesUseCase } from './list-interview-stages';

let interviewStagesRepository: InMemoryInterviewStagesRepository;
let sut: ListInterviewStagesUseCase;

const tenantId = new UniqueEntityID().toString();
const jobPostingId = new UniqueEntityID().toString();

describe('List Interview Stages Use Case', () => {
  beforeEach(async () => {
    interviewStagesRepository = new InMemoryInterviewStagesRepository();
    sut = new ListInterviewStagesUseCase(interviewStagesRepository);

    await interviewStagesRepository.create({
      tenantId,
      jobPostingId,
      name: 'Triagem',
      order: 1,
      type: 'SCREENING',
    });
    await interviewStagesRepository.create({
      tenantId,
      jobPostingId,
      name: 'Técnica',
      order: 2,
      type: 'TECHNICAL',
    });
  });

  it('should list stages ordered by order', async () => {
    const result = await sut.execute({ tenantId, jobPostingId });

    expect(result.interviewStages).toHaveLength(2);
    expect(result.interviewStages[0].name).toBe('Triagem');
    expect(result.interviewStages[1].name).toBe('Técnica');
  });
});
