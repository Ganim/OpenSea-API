import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectApplicationUseCase } from './reject-application';

let applicationsRepository: InMemoryApplicationsRepository;
let sut: RejectApplicationUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Reject Application Use Case', () => {
  beforeEach(() => {
    applicationsRepository = new InMemoryApplicationsRepository();
    sut = new RejectApplicationUseCase(applicationsRepository);
  });

  it('should reject an application', async () => {
    const created = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
    });

    const result = await sut.execute({
      tenantId,
      applicationId: created.id.toString(),
      rejectionReason: 'Perfil não atende aos requisitos',
    });

    expect(result.application.status).toBe('REJECTED');
    expect(result.application.rejectedAt).toBeDefined();
    expect(result.application.rejectionReason).toBe(
      'Perfil não atende aos requisitos',
    );
  });

  it('should throw error when rejecting already hired candidate', async () => {
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
      }),
    ).rejects.toThrow('Esta candidatura já foi finalizada');
  });
});
