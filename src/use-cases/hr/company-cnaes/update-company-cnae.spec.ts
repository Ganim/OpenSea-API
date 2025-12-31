import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyCnaesRepository } from '@/repositories/hr/in-memory/in-memory-company-cnaes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyCnaeUseCase } from './create-company-cnae';
import { UpdateCompanyCnaeUseCase } from './update-company-cnae';

let repository: InMemoryCompanyCnaesRepository;
let createUseCase: CreateCompanyCnaeUseCase;
let updateUseCase: UpdateCompanyCnaeUseCase;

describe('UpdateCompanyCnaeUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyCnaesRepository();
    createUseCase = new CreateCompanyCnaeUseCase(repository);
    updateUseCase = new UpdateCompanyCnaeUseCase(repository);
  });

  it('should update cnae description', async () => {
    const companyId = new UniqueEntityID().toString();

    const created = await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    const { cnae } = await updateUseCase.execute({
      cnaeId: created.cnae.id.toString(),
      companyId,
      description: 'Atividade de consultoria em tecnologia',
    });

    expect(cnae.description).toBe('Atividade de consultoria em tecnologia');
  });

  it('should update cnae status', async () => {
    const companyId = new UniqueEntityID().toString();

    const created = await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    const { cnae } = await updateUseCase.execute({
      cnaeId: created.cnae.id.toString(),
      companyId,
      status: 'INACTIVE',
    });

    expect(cnae.status).toBe('INACTIVE');
  });

  it('should change primary flag and unset other primary', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    const second = await createUseCase.execute({
      companyId,
      code: '4721000',
    });

    const { cnae } = await updateUseCase.execute({
      cnaeId: second.cnae.id.toString(),
      companyId,
      isPrimary: true,
    });

    expect(cnae.isPrimary).toBe(true);

    const all = await repository.findMany({
      companyId: new UniqueEntityID(companyId),
    });

    const primaries = all.cnaes.filter((c) => c.isPrimary);
    expect(primaries.length).toBe(1);
    expect(primaries[0].id.equals(cnae.id)).toBe(true);
  });

  it('should not allow duplicate code change', async () => {
    const companyId = new UniqueEntityID().toString();

    const first = await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    await createUseCase.execute({
      companyId,
      code: '4721000',
    });

    await expect(
      updateUseCase.execute({
        cnaeId: first.cnae.id.toString(),
        companyId,
        code: '4721000',
      }),
    ).rejects.toThrow('CNAE code already exists for this company');
  });
});
