import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyCnaesRepository } from '@/repositories/hr/in-memory/in-memory-company-cnaes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyCnaeUseCase } from './create-company-cnae';
import { GetCompanyCnaeUseCase } from './get-company-cnae';

let repository: InMemoryCompanyCnaesRepository;
let createUseCase: CreateCompanyCnaeUseCase;
let getUseCase: GetCompanyCnaeUseCase;

describe('GetCompanyCnaeUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyCnaesRepository();
    createUseCase = new CreateCompanyCnaeUseCase(repository);
    getUseCase = new GetCompanyCnaeUseCase(repository);
  });

  it('should get a company cnae by id', async () => {
    const companyId = new UniqueEntityID().toString();

    const created = await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    const { cnae } = await getUseCase.execute({
      cnaeId: created.cnae.id.toString(),
      companyId,
    });

    expect(cnae.id.equals(created.cnae.id)).toBe(true);
    expect(cnae.code).toBe('4711301');
  });

  it('should throw error if cnae does not exist', async () => {
    const companyId = new UniqueEntityID().toString();
    const cnaeId = new UniqueEntityID().toString();

    await expect(
      getUseCase.execute({
        cnaeId,
        companyId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error if cnae belongs to different company', async () => {
    const companyId1 = new UniqueEntityID().toString();
    const companyId2 = new UniqueEntityID().toString();

    const created = await createUseCase.execute({
      companyId: companyId1,
      code: '4711301',
    });

    await expect(
      getUseCase.execute({
        cnaeId: created.cnae.id.toString(),
        companyId: companyId2,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
