import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyCnaesRepository } from '@/repositories/hr/in-memory/in-memory-company-cnaes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyCnaeUseCase } from './create-company-cnae';

let repository: InMemoryCompanyCnaesRepository;
let sut: CreateCompanyCnaeUseCase;

describe('CreateCompanyCnaeUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyCnaesRepository();
    sut = new CreateCompanyCnaeUseCase(repository);
  });

  it('should create a company cnae with minimal data (code required)', async () => {
    const companyId = new UniqueEntityID().toString();

    const { cnae } = await sut.execute({
      companyId,
      code: '4711301',
    });

    expect(cnae).toBeTruthy();
    expect(cnae.code).toBe('4711301');
    expect(cnae.status).toBe('ACTIVE');
    expect(cnae.isPrimary).toBe(false);
    expect(cnae.pendingIssues.length).toBeGreaterThan(0);
  });

  it('should not allow duplicated code for the same company', async () => {
    const companyId = new UniqueEntityID().toString();

    await sut.execute({
      companyId,
      code: '4711301',
    });

    await expect(
      sut.execute({
        companyId,
        code: '4711301',
      }),
    ).rejects.toThrow('CNAE code already exists for this company');
  });

  it('should unset other primary when creating a new primary', async () => {
    const companyId = new UniqueEntityID().toString();

    const first = await sut.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    expect(first.cnae.isPrimary).toBe(true);

    const second = await sut.execute({
      companyId,
      code: '4721000',
      isPrimary: true,
    });

    const all = await repository.findMany({
      companyId: new UniqueEntityID(companyId),
    });

    const primaries = all.cnaes.filter((addr) => addr.isPrimary);
    expect(primaries.length).toBe(1);
    expect(primaries[0].id.equals(second.cnae.id)).toBe(true);
  });
});
