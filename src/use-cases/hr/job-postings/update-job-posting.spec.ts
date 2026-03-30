import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateJobPostingUseCase } from './update-job-posting';

let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: UpdateJobPostingUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Job Posting Use Case', () => {
  beforeEach(() => {
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new UpdateJobPostingUseCase(jobPostingsRepository);
  });

  it('should update a job posting', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'Old Title',
      type: 'FULL_TIME',
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: created.id.toString(),
      title: 'New Title',
      location: 'Remote',
    });

    expect(result.jobPosting.title).toBe('New Title');
    expect(result.jobPosting.location).toBe('Remote');
  });

  it('should throw error for empty title', async () => {
    const created = await jobPostingsRepository.create({
      tenantId,
      title: 'Old Title',
      type: 'FULL_TIME',
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: created.id.toString(),
        title: '',
      }),
    ).rejects.toThrow('O título da vaga é obrigatório');
  });

  it('should throw error for non-existing job posting', async () => {
    await expect(
      sut.execute({
        tenantId,
        jobPostingId: new UniqueEntityID().toString(),
        title: 'New Title',
      }),
    ).rejects.toThrow('Vaga não encontrada');
  });
});
