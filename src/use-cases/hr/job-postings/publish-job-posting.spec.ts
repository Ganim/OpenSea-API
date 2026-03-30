import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PublishJobPostingUseCase } from './publish-job-posting';

let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: PublishJobPostingUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Publish Job Posting Use Case', () => {
  beforeEach(() => {
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new PublishJobPostingUseCase(jobPostingsRepository);
  });

  it('should publish a draft job posting', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'Vaga Draft',
      status: 'DRAFT',
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: created.id.toString(),
    });

    expect(result.jobPosting.status).toBe('OPEN');
    expect(result.jobPosting.publishedAt).toBeDefined();
  });

  it('should throw error when publishing a non-draft posting', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'Vaga Open',
      status: 'OPEN',
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: created.id.toString(),
      }),
    ).rejects.toThrow('Apenas vagas em rascunho podem ser publicadas');
  });
});
