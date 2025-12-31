import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyCnaesRepository } from '@/repositories/hr/in-memory/in-memory-company-cnaes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyCnaeUseCase } from './create-company-cnae';
import { DeleteCompanyCnaeUseCase } from './delete-company-cnae';

let repository: InMemoryCompanyCnaesRepository;
let createUseCase: CreateCompanyCnaeUseCase;
let deleteUseCase: DeleteCompanyCnaeUseCase;

describe('DeleteCompanyCnaeUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyCnaesRepository();
    createUseCase = new CreateCompanyCnaeUseCase(repository);
    deleteUseCase = new DeleteCompanyCnaeUseCase(repository);
  });

  it('should soft-delete a company cnae', async () => {
    const companyId = new UniqueEntityID().toString();

    const created = await createUseCase.execute({
      companyId,
      code: '4711301',
    });

    await deleteUseCase.execute({
      cnaeId: created.cnae.id.toString(),
      companyId,
    });

    const all = await repository.findMany({
      companyId: new UniqueEntityID(companyId),
    });

    expect(all.cnaes.length).toBe(0);
  });

  it('should throw error if cnae does not exist', async () => {
    const companyId = new UniqueEntityID().toString();
    const cnaeId = new UniqueEntityID().toString();

    await expect(
      deleteUseCase.execute({
        cnaeId,
        companyId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
