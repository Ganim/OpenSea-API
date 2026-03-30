import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateApplicationStatusUseCase } from './update-application-status';

let applicationsRepository: InMemoryApplicationsRepository;
let sut: UpdateApplicationStatusUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Application Status Use Case', () => {
  beforeEach(() => {
    applicationsRepository = new InMemoryApplicationsRepository();
    sut = new UpdateApplicationStatusUseCase(applicationsRepository);
  });

  it('should update application status', async () => {
    const created = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
    });

    const result = await sut.execute({
      tenantId,
      applicationId: created.id.toString(),
      status: 'SCREENING',
    });

    expect(result.application.status).toBe('SCREENING');
  });

  it('should throw error for invalid status', async () => {
    const created = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: created.id.toString(),
        status: 'INVALID',
      }),
    ).rejects.toThrow('Status inválido');
  });

  it('should throw error when updating finalized application', async () => {
    const created = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
      status: 'HIRED',
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: created.id.toString(),
        status: 'SCREENING',
      }),
    ).rejects.toThrow(
      'Não é possível alterar o status de uma candidatura finalizada',
    );
  });
});
