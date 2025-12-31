import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyCnaesRepository } from '@/repositories/hr/in-memory/in-memory-company-cnaes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyCnaeUseCase } from './create-company-cnae';
import { ListCompanyCnaesUseCase } from './list-company-cnaes';

let repository: InMemoryCompanyCnaesRepository;
let createUseCase: CreateCompanyCnaeUseCase;
let listUseCase: ListCompanyCnaesUseCase;

describe('ListCompanyCnaesUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyCnaesRepository();
    createUseCase = new CreateCompanyCnaeUseCase(repository);
    listUseCase = new ListCompanyCnaesUseCase(repository);
  });

  it('should list all cnaes for a company', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    await createUseCase.execute({
      companyId,
      code: '4721000',
    });

    const { cnaes } = await listUseCase.execute({
      companyId,
    });

    expect(cnaes.length).toBe(2);
  });

  it('should filter by code', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    await createUseCase.execute({
      companyId,
      code: '4721000',
    });

    const { cnaes } = await listUseCase.execute({
      companyId,
      code: '4711301',
    });

    expect(cnaes.length).toBe(1);
    expect(cnaes[0].code).toBe('4711301');
  });

  it('should filter by isPrimary', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      code: '4711301',
      isPrimary: true,
    });

    await createUseCase.execute({
      companyId,
      code: '4721000',
    });

    const { cnaes: primaries } = await listUseCase.execute({
      companyId,
      isPrimary: true,
    });

    expect(primaries.length).toBe(1);
    expect(primaries[0].isPrimary).toBe(true);
  });

  it('should filter by status', async () => {
    const companyId = new UniqueEntityID().toString();

    await createUseCase.execute({
      companyId,
      code: '4711301',
      status: 'ACTIVE',
    });

    await createUseCase.execute({
      companyId,
      code: '4721000',
      status: 'INACTIVE',
    });

    const { cnaes: active } = await listUseCase.execute({
      companyId,
      status: 'ACTIVE',
    });

    expect(active.length).toBe(1);
    expect(active[0].status).toBe('ACTIVE');
  });

  it('should return empty list if company has no cnaes', async () => {
    const companyId = new UniqueEntityID().toString();

    const { cnaes } = await listUseCase.execute({
      companyId,
    });

    expect(cnaes.length).toBe(0);
  });
});
