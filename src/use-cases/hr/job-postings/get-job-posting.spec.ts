import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetJobPostingUseCase } from './get-job-posting';

let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: GetJobPostingUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Job Posting Use Case', () => {
  beforeEach(() => {
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new GetJobPostingUseCase(jobPostingsRepository);
  });

  it('should get a job posting by id', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'Desenvolvedor Backend',
      type: 'FULL_TIME',
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: created.id.toString(),
    });

    expect(result.jobPosting.title).toBe('Desenvolvedor Backend');
  });

  it('should throw error for non-existing job posting', async () => {
    await expect(
      sut.execute({
        tenantId,
        jobPostingId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Vaga não encontrada');
  });
});
