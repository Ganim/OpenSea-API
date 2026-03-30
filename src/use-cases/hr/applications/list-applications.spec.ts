import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListApplicationsUseCase } from './list-applications';

let applicationsRepository: InMemoryApplicationsRepository;
let sut: ListApplicationsUseCase;

const tenantId = new UniqueEntityID().toString();
const jobPostingId = new UniqueEntityID().toString();

describe('List Applications Use Case', () => {
  beforeEach(async () => {
    applicationsRepository = new InMemoryApplicationsRepository();
    sut = new ListApplicationsUseCase(applicationsRepository);

    await applicationsRepository.create({
      tenantId,
      jobPostingId,
      candidateId: new UniqueEntityID().toString(),
      status: 'APPLIED',
    });
    await applicationsRepository.create({
      tenantId,
      jobPostingId,
      candidateId: new UniqueEntityID().toString(),
      status: 'INTERVIEW',
    });
  });

  it('should list all applications', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.applications).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by job posting', async () => {
    const result = await sut.execute({ tenantId, jobPostingId });

    expect(result.applications).toHaveLength(2);
  });

  it('should filter by status', async () => {
    const result = await sut.execute({ tenantId, status: 'INTERVIEW' });

    expect(result.applications).toHaveLength(1);
  });
});
