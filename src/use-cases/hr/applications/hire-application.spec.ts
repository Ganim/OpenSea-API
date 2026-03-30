import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { HireApplicationUseCase } from './hire-application';

let applicationsRepository: InMemoryApplicationsRepository;
let sut: HireApplicationUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Hire Application Use Case', () => {
  beforeEach(() => {
    applicationsRepository = new InMemoryApplicationsRepository();
    sut = new HireApplicationUseCase(applicationsRepository);
  });

  it('should hire a candidate', async () => {
    const created = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
      status: 'OFFER',
    });

    const result = await sut.execute({
      tenantId,
      applicationId: created.id.toString(),
    });

    expect(result.application.status).toBe('HIRED');
    expect(result.application.hiredAt).toBeDefined();
  });

  it('should throw error when hiring rejected candidate', async () => {
    const created = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
      status: 'REJECTED',
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: created.id.toString(),
      }),
    ).rejects.toThrow(
      'Não é possível contratar um candidato com candidatura rejeitada ou desistente',
    );
  });

  it('should throw error when candidate already hired', async () => {
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
    ).rejects.toThrow('Este candidato já foi contratado');
  });
});
