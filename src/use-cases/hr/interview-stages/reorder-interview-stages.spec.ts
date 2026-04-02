import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewStagesRepository } from '@/repositories/hr/in-memory/in-memory-interview-stages-repository';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReorderInterviewStagesUseCase } from './reorder-interview-stages';

let interviewStagesRepository: InMemoryInterviewStagesRepository;
let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: ReorderInterviewStagesUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Reorder Interview Stages Use Case', () => {
  beforeEach(() => {
    interviewStagesRepository = new InMemoryInterviewStagesRepository();
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new ReorderInterviewStagesUseCase(
      interviewStagesRepository,
      jobPostingsRepository,
    );
  });

  it('should reorder stages', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Dev Job',
    });

    const stage1 = await interviewStagesRepository.create({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      name: 'Stage 1',
      order: 1,
    });
    const stage2 = await interviewStagesRepository.create({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      name: 'Stage 2',
      order: 2,
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      stageIds: [stage2.id.toString(), stage1.id.toString()],
    });

    expect(result.success).toBe(true);

    const stages = await interviewStagesRepository.findManyByJobPosting(
      jobPosting.id.toString(),
      tenantId,
    );
    expect(stages[0].name).toBe('Stage 2');
    expect(stages[1].name).toBe('Stage 1');
  });
});
