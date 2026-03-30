import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListJobPostingsUseCase } from './list-job-postings';

let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: ListJobPostingsUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Job Postings Use Case', () => {
  beforeEach(async () => {
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new ListJobPostingsUseCase(jobPostingsRepository);

    await jobPostingsRepository.create({
      tenantId,
      title: 'Desenvolvedor Frontend',
      type: 'FULL_TIME',
      status: 'OPEN',
    });
    await jobPostingsRepository.create({
      tenantId,
      title: 'Estagiário de TI',
      type: 'INTERN',
      status: 'DRAFT',
    });
  });

  it('should list all job postings for a tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.jobPostings).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by status', async () => {
    const result = await sut.execute({ tenantId, status: 'OPEN' });

    expect(result.jobPostings).toHaveLength(1);
    expect(result.jobPostings[0].status).toBe('OPEN');
  });

  it('should filter by type', async () => {
    const result = await sut.execute({ tenantId, type: 'INTERN' });

    expect(result.jobPostings).toHaveLength(1);
    expect(result.jobPostings[0].type).toBe('INTERN');
  });

  it('should filter by search term', async () => {
    const result = await sut.execute({ tenantId, search: 'Frontend' });

    expect(result.jobPostings).toHaveLength(1);
    expect(result.jobPostings[0].title).toBe('Desenvolvedor Frontend');
  });

  it('should paginate results', async () => {
    const result = await sut.execute({ tenantId, page: 1, perPage: 1 });

    expect(result.jobPostings).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});
