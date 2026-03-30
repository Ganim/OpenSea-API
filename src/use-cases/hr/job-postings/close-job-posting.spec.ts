import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CloseJobPostingUseCase } from './close-job-posting';

let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: CloseJobPostingUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Close Job Posting Use Case', () => {
  beforeEach(() => {
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new CloseJobPostingUseCase(jobPostingsRepository);
  });

  it('should close an open job posting', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'Vaga Aberta',
      status: 'OPEN',
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: created.id.toString(),
    });

    expect(result.jobPosting.status).toBe('CLOSED');
    expect(result.jobPosting.closedAt).toBeDefined();
  });

  it('should throw error when closing a non-open posting', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'Vaga Draft',
      status: 'DRAFT',
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: created.id.toString(),
      }),
    ).rejects.toThrow('Apenas vagas abertas podem ser encerradas');
  });
});
