import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnonymizeCandidateUseCase } from '../candidates/anonymize-candidate';
import { RejectApplicationUseCase } from './reject-application';

let applicationsRepository: InMemoryApplicationsRepository;
let candidatesRepository: InMemoryCandidatesRepository;
let anonymizeCandidateUseCase: AnonymizeCandidateUseCase;
let sut: RejectApplicationUseCase;

const tenantId = new UniqueEntityID().toString();
const actorUserId = new UniqueEntityID().toString();

describe('Reject Application Use Case', () => {
  beforeEach(() => {
    applicationsRepository = new InMemoryApplicationsRepository();
    candidatesRepository = new InMemoryCandidatesRepository();
    anonymizeCandidateUseCase = new AnonymizeCandidateUseCase(
      candidatesRepository,
    );
    sut = new RejectApplicationUseCase(
      applicationsRepository,
      anonymizeCandidateUseCase,
    );
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
      actorUserId,
    });

    expect(result.application.status).toBe('REJECTED');
    expect(result.application.rejectedAt).toBeDefined();
    expect(result.application.rejectionReason).toBe(
      'Perfil não atende aos requisitos',
    );
    expect(result.candidateAnonymized).toBe(false);
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

  it('should anonymize the candidate PII when final=true', async () => {
    const candidate = await candidatesRepository.create({
      tenantId,
      fullName: 'Pedro Silva',
      email: 'pedro.silva@example.com',
      cpf: '529.982.247-25',
      phone: '+5511911112222',
    });
    const application = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: candidate.id.toString(),
    });

    const result = await sut.execute({
      tenantId,
      applicationId: application.id.toString(),
      rejectionReason: 'Processo encerrado',
      final: true,
      actorUserId,
    });

    expect(result.application.status).toBe('REJECTED');
    expect(result.candidateAnonymized).toBe(true);

    const scrubbed = await candidatesRepository.findById(
      candidate.id,
      tenantId,
    );
    expect(scrubbed?.isAnonymized).toBe(true);
    expect(scrubbed?.fullName).toMatch(/^ANONIMIZADO-/);
    expect(scrubbed?.cpf).toBeUndefined();
    expect(scrubbed?.phone).toBeUndefined();
    expect(scrubbed?.anonymizedBy).toBe(actorUserId);
  });

  it('should leave candidate PII untouched when final=false', async () => {
    const candidate = await candidatesRepository.create({
      tenantId,
      fullName: 'Ana Souza',
      email: 'ana.souza@example.com',
      cpf: '529.982.247-25',
      phone: '+5511933334444',
    });
    const application = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: candidate.id.toString(),
    });

    const result = await sut.execute({
      tenantId,
      applicationId: application.id.toString(),
      final: false,
      actorUserId,
    });

    expect(result.candidateAnonymized).toBe(false);

    const untouched = await candidatesRepository.findById(
      candidate.id,
      tenantId,
    );
    expect(untouched?.isAnonymized).toBe(false);
    expect(untouched?.fullName).toBe('Ana Souza');
    expect(untouched?.cpf).toBe('529.982.247-25');
  });
});
