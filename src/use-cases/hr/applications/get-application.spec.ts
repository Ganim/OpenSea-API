import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetApplicationUseCase } from './get-application';

let applicationsRepository: InMemoryApplicationsRepository;
let sut: GetApplicationUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Application Use Case', () => {
  beforeEach(() => {
    applicationsRepository = new InMemoryApplicationsRepository();
    sut = new GetApplicationUseCase(applicationsRepository);
  });

  it('should get an application by id', async () => {
    const created = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
    });

    const result = await sut.execute({
      tenantId,
      applicationId: created.id.toString(),
    });

    expect(result.application).toBeDefined();
    expect(result.application.status).toBe('APPLIED');
  });

  it('should throw error for non-existing application', async () => {
    await expect(
      sut.execute({
        tenantId,
        applicationId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Candidatura não encontrada');
  });
});
