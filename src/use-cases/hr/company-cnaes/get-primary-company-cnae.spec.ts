import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyCnaesRepository } from '@/repositories/hr/in-memory/in-memory-company-cnaes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyCnaeUseCase } from './create-company-cnae';
import { GetPrimaryCompanyCnaeUseCase } from './get-primary-company-cnae';

let repository: InMemoryCompanyCnaesRepository;
let createUseCase: CreateCompanyCnaeUseCase;
let getPrimaryUseCase: GetPrimaryCompanyCnaeUseCase;

describe('GetPrimaryCompanyCnaeUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyCnaesRepository();
    createUseCase = new CreateCompanyCnaeUseCase(repository);
    getPrimaryUseCase = new GetPrimaryCompanyCnaeUseCase(repository);
  });

  it('should get primary cnae for a company', async () => {
    const companyId = new UniqueEntityID().toString();

    const created = await createUseCase.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    const result = await getPrimaryUseCase.execute({
      companyId,
    });

    expect(result.cnae).toBeTruthy();
    expect(result.cnae?.id.equals(created.cnae.id)).toBe(true);
    expect(result.cnae?.isPrimary).toBe(true);
  });

  it('should return null if company has no primary cnae', async () => {
    const companyId = new UniqueEntityID().toString();

    const result = await getPrimaryUseCase.execute({
      companyId,
    });

    expect(result.cnae).toBeNull();
  });

  it('should return only the primary when multiple cnaes exist', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    const primary = await createUseCase.execute({
      companyId,
      code: '4721000',
      isPrimary: true,
    });

    const result = await getPrimaryUseCase.execute({
      companyId,
    });

    expect(result.cnae?.id.equals(primary.cnae.id)).toBe(true);
  });
});
