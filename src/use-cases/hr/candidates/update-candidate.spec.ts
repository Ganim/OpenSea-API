import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateCandidateUseCase } from './update-candidate';

let candidatesRepository: InMemoryCandidatesRepository;
let sut: UpdateCandidateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Candidate Use Case', () => {
  beforeEach(() => {
    candidatesRepository = new InMemoryCandidatesRepository();
    sut = new UpdateCandidateUseCase(candidatesRepository);
  });

  it('should update a candidate', async () => {
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'Old Name',
      email: 'old@test.com',
    });

    const result = await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
      fullName: 'New Name',
      phone: '11999999999',
    });

    expect(result.candidate.fullName).toBe('New Name');
    expect(result.candidate.phone).toBe('11999999999');
  });

  it('should throw error for empty name', async () => {
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'Maria',
      email: 'maria@test.com',
    });

    await expect(
      sut.execute({
        tenantId,
        candidateId: created.id.toString(),
        fullName: '',
      }),
    ).rejects.toThrow('O nome do candidato é obrigatório');
  });
});
