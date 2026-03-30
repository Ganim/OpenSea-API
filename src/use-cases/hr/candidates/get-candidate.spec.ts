import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCandidateUseCase } from './get-candidate';

let candidatesRepository: InMemoryCandidatesRepository;
let sut: GetCandidateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Candidate Use Case', () => {
  beforeEach(() => {
    candidatesRepository = new InMemoryCandidatesRepository();
    sut = new GetCandidateUseCase(candidatesRepository);
  });

  it('should get a candidate by id', async () => {
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'Maria Silva',
      email: 'maria@test.com',
    });

    const result = await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
    });

    expect(result.candidate.fullName).toBe('Maria Silva');
  });

  it('should throw error for non-existing candidate', async () => {
    await expect(
      sut.execute({
        tenantId,
        candidateId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Candidato não encontrado');
  });
});
