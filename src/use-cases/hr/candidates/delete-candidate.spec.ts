import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteCandidateUseCase } from './delete-candidate';

let candidatesRepository: InMemoryCandidatesRepository;
let sut: DeleteCandidateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Candidate Use Case', () => {
  beforeEach(() => {
    candidatesRepository = new InMemoryCandidatesRepository();
    sut = new DeleteCandidateUseCase(candidatesRepository);
  });

  it('should soft delete a candidate', async () => {
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'To Delete',
      email: 'delete@test.com',
    });

    await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
    });

    const found = await candidatesRepository.findById(
      created.id,
      tenantId,
    );
    expect(found).toBeNull();
  });
});
