import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteJobPostingUseCase } from './delete-job-posting';

let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: DeleteJobPostingUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Job Posting Use Case', () => {
  beforeEach(() => {
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new DeleteJobPostingUseCase(jobPostingsRepository);
  });

  it('should soft delete a job posting', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'To Delete',
      type: 'FULL_TIME',
    });

    await sut.execute({
      tenantId,
      jobPostingId: created.id.toString(),
    });

    const found = await jobPostingsRepository.findById(created.id, tenantId);
    expect(found).toBeNull();
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
