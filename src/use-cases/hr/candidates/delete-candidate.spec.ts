import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnonymizeCandidateUseCase } from './anonymize-candidate';
import { DeleteCandidateUseCase } from './delete-candidate';

let candidatesRepository: InMemoryCandidatesRepository;
let anonymizeCandidateUseCase: AnonymizeCandidateUseCase;
let sut: DeleteCandidateUseCase;

const tenantId = new UniqueEntityID().toString();
const actorUserId = new UniqueEntityID().toString();

describe('Delete Candidate Use Case', () => {
  beforeEach(() => {
    candidatesRepository = new InMemoryCandidatesRepository();
    anonymizeCandidateUseCase = new AnonymizeCandidateUseCase(
      candidatesRepository,
    );
    sut = new DeleteCandidateUseCase(
      candidatesRepository,
      anonymizeCandidateUseCase,
    );
  });

  it('should soft delete and anonymize a candidate', async () => {
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'To Delete',
      email: 'delete@test.com',
      cpf: '529.982.247-25',
      phone: '+5511988887777',
    });

    await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
      actorUserId,
    });

    // Soft-delete path: findById hides deleted rows.
    const found = await candidatesRepository.findById(created.id, tenantId);
    expect(found).toBeNull();

    // PII scrub path: the underlying record was anonymized before the
    // soft-delete flag was set, so the stored row is LGPD-compliant.
    const storedRow = candidatesRepository.items.find((candidate) =>
      candidate.id.equals(created.id),
    );
    expect(storedRow?.isAnonymized).toBe(true);
    expect(storedRow?.fullName).toMatch(/^ANONIMIZADO-/);
    expect(storedRow?.cpf).toBeUndefined();
    expect(storedRow?.phone).toBeUndefined();
    expect(storedRow?.anonymizedBy).toBe(actorUserId);
  });

  it('should throw 404 when the candidate does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        candidateId: new UniqueEntityID().toString(),
        actorUserId,
      }),
    ).rejects.toThrow('Candidato não encontrado');
  });

  it('should still soft-delete when the anonymize dependency is not wired', async () => {
    const bareSut = new DeleteCandidateUseCase(candidatesRepository);
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'Legacy Path',
      email: 'legacy@test.com',
    });

    await bareSut.execute({
      tenantId,
      candidateId: created.id.toString(),
    });

    const found = await candidatesRepository.findById(created.id, tenantId);
    expect(found).toBeNull();
  });
});
