import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCandidateUseCase } from './create-candidate';

let candidatesRepository: InMemoryCandidatesRepository;
let sut: CreateCandidateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Candidate Use Case', () => {
  beforeEach(() => {
    candidatesRepository = new InMemoryCandidatesRepository();
    sut = new CreateCandidateUseCase(candidatesRepository);
  });

  it('should create a candidate successfully', async () => {
    const result = await sut.execute({
      tenantId,
      fullName: 'Maria Silva',
      email: 'maria@exemplo.com',
      phone: '11999999999',
      source: 'LINKEDIN',
    });

    expect(result.candidate).toBeDefined();
    expect(result.candidate.fullName).toBe('Maria Silva');
    expect(result.candidate.email).toBe('maria@exemplo.com');
    expect(result.candidate.source).toBe('LINKEDIN');
    expect(candidatesRepository.items).toHaveLength(1);
  });

  it('should throw error for empty name', async () => {
    await expect(
      sut.execute({
        tenantId,
        fullName: '',
        email: 'test@test.com',
      }),
    ).rejects.toThrow('O nome do candidato é obrigatório');
  });

  it('should throw error for empty email', async () => {
    await expect(
      sut.execute({
        tenantId,
        fullName: 'João',
        email: '',
      }),
    ).rejects.toThrow('O e-mail do candidato é obrigatório');
  });

  it('should throw error for invalid source', async () => {
    await expect(
      sut.execute({
        tenantId,
        fullName: 'João',
        email: 'joao@test.com',
        source: 'INVALID',
      }),
    ).rejects.toThrow('Origem inválida');
  });

  it('should throw error for duplicate email in same tenant', async () => {
    await sut.execute({
      tenantId,
      fullName: 'Maria Silva',
      email: 'maria@exemplo.com',
    });

    await expect(
      sut.execute({
        tenantId,
        fullName: 'Maria Oliveira',
        email: 'maria@exemplo.com',
      }),
    ).rejects.toThrow('Já existe um candidato cadastrado com este e-mail');
  });
});
