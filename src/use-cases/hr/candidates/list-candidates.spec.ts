import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCandidatesUseCase } from './list-candidates';

let candidatesRepository: InMemoryCandidatesRepository;
let sut: ListCandidatesUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Candidates Use Case', () => {
  beforeEach(async () => {
    candidatesRepository = new InMemoryCandidatesRepository();
    sut = new ListCandidatesUseCase(candidatesRepository);

    await candidatesRepository.create({
      tenantId,
      fullName: 'Maria Silva',
      email: 'maria@test.com',
      source: 'LINKEDIN',
    });
    await candidatesRepository.create({
      tenantId,
      fullName: 'João Santos',
      email: 'joao@test.com',
      source: 'WEBSITE',
    });
  });

  it('should list all candidates', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.candidates).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by source', async () => {
    const result = await sut.execute({ tenantId, source: 'LINKEDIN' });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].fullName).toBe('Maria Silva');
  });

  it('should search by name', async () => {
    const result = await sut.execute({ tenantId, search: 'Maria' });

    expect(result.candidates).toHaveLength(1);
  });
});
